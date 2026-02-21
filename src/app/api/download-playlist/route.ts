import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, unlink, mkdtemp, rmdir, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { zipSync } from "fflate";
import { getPlaylistInfo, type TrackInfo } from "@/lib/spotify";
import { fetchBestAudio } from "@/lib/audio-sources";
import { fetchLyrics } from "@/lib/lyrics";
import { rateLimit } from "@/lib/ratelimit";

const execFileAsync = promisify(execFile);

export const maxDuration = 300;

const ALLOWED_ART_HOSTS = [
  "i.scdn.co",
  "mosaic.scdn.co",
  "image-cdn-ak.spotifycdn.com",
  "image-cdn-fa.spotifycdn.com",
];

function isAllowedUrl(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedHosts.some((host) => parsed.hostname.endsWith(host));
  } catch {
    return false;
  }
}

async function processTrack(
  track: TrackInfo,
  requestedFormat: string | undefined
): Promise<{ filename: string; buffer: Buffer }> {
  const preferLossless = requestedFormat === "flac" || requestedFormat === "alac";

  const [audio, lyrics] = await Promise.all([
    fetchBestAudio(track, preferLossless),
    fetchLyrics(track.artist, track.name),
  ]);

  const canLossless = preferLossless && audio.source === "deezer";
  const wantAlac = canLossless && requestedFormat === "alac";
  const wantFlac = canLossless && requestedFormat === "flac";

  const tempDir = await mkdtemp(join(tmpdir(), "dl-"));
  try {
    const inputExt = audio.format === "webm" ? "webm" : audio.format === "flac" ? "flac" : "mp3";
    const inputPath = join(tempDir, `input.${inputExt}`);
    const outputExt = wantAlac ? "m4a" : wantFlac ? "flac" : "mp3";
    const outputPath = join(tempDir, `output.${outputExt}`);
    const artPath = join(tempDir, "cover.jpg");

    await writeFile(inputPath, audio.buffer);

    let hasArt = false;
    if (track.albumArt && isAllowedUrl(track.albumArt, ALLOWED_ART_HOSTS)) {
      try {
        const artRes = await fetch(track.albumArt);
        if (artRes.ok) {
          const artBuffer = Buffer.from(await artRes.arrayBuffer());
          await writeFile(artPath, artBuffer);
          hasArt = true;
        }
      } catch {
        // Skip album art on failure
      }
    }

    const ffmpegArgs: string[] = [];
    ffmpegArgs.push("-i", inputPath);

    if (wantAlac) {
      if (hasArt) {
        ffmpegArgs.push("-i", artPath, "-map", "0:a", "-map", "1:0");
      }
      ffmpegArgs.push("-c:a", "alac");
      if (hasArt) {
        ffmpegArgs.push("-c:v", "copy", "-disposition:v", "attached_pic");
      }
    } else if (wantFlac) {
      if (hasArt) {
        ffmpegArgs.push("-i", artPath, "-map", "0:a", "-map", "1:0");
      }
      if (audio.format === "flac") {
        ffmpegArgs.push("-c:a", "copy");
      } else {
        ffmpegArgs.push("-c:a", "flac");
      }
      if (hasArt) {
        ffmpegArgs.push("-c:v", "copy", "-disposition:v", "attached_pic");
      }
    } else {
      if (hasArt) {
        ffmpegArgs.push("-i", artPath, "-map", "0:a", "-map", "1:0");
      }
      if (audio.source === "deezer" && audio.format === "mp3") {
        ffmpegArgs.push("-c:a", "copy");
      } else {
        ffmpegArgs.push("-c:a", "libmp3lame", "-b:a", "320k");
      }
      if (hasArt) {
        ffmpegArgs.push(
          "-c:v", "copy",
          "-id3v2_version", "3",
          "-metadata:s:v", "title=Album cover",
          "-metadata:s:v", "comment=Cover (front)",
          "-disposition:v", "attached_pic"
        );
      } else {
        ffmpegArgs.push("-id3v2_version", "3");
      }
    }

    ffmpegArgs.push(
      "-metadata", `title=${track.name}`,
      "-metadata", `artist=${track.artist}`,
      "-metadata", `album=${track.album}`,
    );
    if (track.genre) {
      ffmpegArgs.push("-metadata", `genre=${track.genre}`);
    }
    if (track.releaseDate) {
      ffmpegArgs.push("-metadata", `date=${track.releaseDate}`);
    }
    if (lyrics) {
      ffmpegArgs.push("-metadata", `lyrics=${lyrics}`);
    }
    ffmpegArgs.push("-y", outputPath);

    try {
      await execFileAsync("ffmpeg", ffmpegArgs, {
        timeout: 120000,
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch {
      try {
        const fallbackArgs = wantAlac
          ? ["-y", "-i", inputPath, "-c:a", "alac", outputPath]
          : wantFlac
            ? ["-y", "-i", inputPath, "-c:a", "flac", outputPath]
            : ["-y", "-i", inputPath, "-c:a", "libmp3lame", "-b:a", "320k", outputPath];
        await execFileAsync("ffmpeg", fallbackArgs, {
          timeout: 120000,
          maxBuffer: 50 * 1024 * 1024,
        });
      } catch {
        const filename = `${track.artist} - ${track.name}.${audio.format}`;
        return { filename, buffer: audio.buffer };
      }
    }

    const outputBuffer = await readFile(outputPath);
    const filename = `${track.artist} - ${track.name}.${outputExt}`;
    return { filename, buffer: outputBuffer };
  } finally {
    try {
      const files = await readdir(tempDir);
      await Promise.all(files.map((f) => unlink(join(tempDir, f))));
      await rmdir(tempDir);
    } catch {
      // Best effort cleanup
    }
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`dl-playlist:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { url, format: requestedFormat } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const playlist = await getPlaylistInfo(url);
    if (!playlist.tracks.length) {
      return NextResponse.json({ error: "Playlist has no tracks" }, { status: 400 });
    }

    // Stream progress events, then the zip binary
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        send({ type: "start", total: playlist.tracks.length });

        const CONCURRENCY = 5;
        const results: { filename: string; buffer: Buffer }[] = new Array(playlist.tracks.length);
        const errors: number[] = [];

        for (let i = 0; i < playlist.tracks.length; i += CONCURRENCY) {
          const batch = playlist.tracks.slice(i, i + CONCURRENCY);
          const batchIndices = batch.map((_, j) => i + j);

          // Notify which tracks started
          send({ type: "batch", indices: batchIndices });

          const batchResults = await Promise.allSettled(
            batch.map((track, j) =>
              processTrack(track, requestedFormat).then((result) => {
                // Send progress as each individual track completes
                send({ type: "done", index: i + j });
                return result;
              })
            )
          );

          for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            if (result.status === "fulfilled") {
              results[i + j] = result.value;
            } else {
              errors.push(i + j);
              send({ type: "error", index: i + j });
              console.error(`[playlist] track ${i + j} failed:`, result.reason);
            }
          }
        }

        if (results.filter(Boolean).length === 0) {
          send({ type: "fatal", error: "All tracks failed to download" });
          controller.close();
          return;
        }

        // Build zip
        send({ type: "zipping" });

        const zipEntries: Record<string, Uint8Array> = {};
        const usedNames = new Set<string>();

        for (const result of results) {
          if (!result) continue;
          let name = sanitizeFilename(result.filename);
          if (usedNames.has(name)) {
            const ext = name.lastIndexOf(".");
            const base = name.slice(0, ext);
            const extStr = name.slice(ext);
            let counter = 2;
            while (usedNames.has(`${base} (${counter})${extStr}`)) counter++;
            name = `${base} (${counter})${extStr}`;
          }
          usedNames.add(name);
          zipEntries[name] = new Uint8Array(result.buffer);
        }

        const zipBuffer = zipSync(zipEntries, { level: 0 });
        const zipFilename = sanitizeFilename(playlist.name) + ".zip";

        // Send zip metadata then binary
        send({ type: "zip", filename: zipFilename, size: zipBuffer.length });
        controller.enqueue(zipBuffer);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Content-Type": "playlist-stream",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Playlist download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
