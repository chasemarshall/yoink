import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  readFile,
  writeFile,
  unlink,
  mkdtemp,
  rmdir,
  readdir,
} from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { getTrackInfo } from "@/lib/spotify";
import { fetchBestAudio } from "@/lib/audio-sources";
import { fetchLyrics } from "@/lib/lyrics";
import { rateLimit } from "@/lib/ratelimit";

const execFileAsync = promisify(execFile);

export const maxDuration = 120;

function isAllowedUrl(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedHosts.some((host) => parsed.hostname.endsWith(host));
  } catch {
    return false;
  }
}

const ALLOWED_ART_HOSTS = [
  "i.scdn.co",
  "mosaic.scdn.co",
  "image-cdn-ak.spotifycdn.com",
  "image-cdn-fa.spotifycdn.com",
];

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`dl:${ip}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json(
        { error: "paste a track or playlist link — artist and album pages aren't supported yet" },
        { status: 400 }
      );
    }

    // Step 1: Get track metadata from Spotify
    const track = await getTrackInfo(url);

    // Step 2: Fetch best audio + lyrics in parallel
    const [audio, lyrics] = await Promise.all([
      fetchBestAudio(track),
      fetchLyrics(track.artist, track.name),
    ]);

    // Step 3: Embed metadata using ffmpeg
    tempDir = await mkdtemp(join(tmpdir(), "dl-"));
    const inputExt = audio.format === "webm" ? "webm" : audio.format === "flac" ? "flac" : "mp3";
    const inputPath = join(tempDir, `input.${inputExt}`);
    const outputPath = join(tempDir, "output.mp3");
    const artPath = join(tempDir, "cover.jpg");

    await writeFile(inputPath, audio.buffer);

    // Download album art (validate URL host)
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

    // Build ffmpeg args based on source format
    const ffmpegArgs: string[] = [];
    ffmpegArgs.push("-i", inputPath);
    if (hasArt) {
      ffmpegArgs.push("-i", artPath, "-map", "0:a", "-map", "1:0");
    }

    // Format-aware encoding:
    // - Deezer 320kbps MP3: copy audio (no re-encode), just add metadata
    // - Deezer FLAC: transcode to 320k MP3
    // - YouTube WebM/Opus: transcode to 320k MP3 (existing behavior)
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
    ffmpegArgs.push(
      "-metadata", `title=${track.name}`,
      "-metadata", `artist=${track.artist}`,
      "-metadata", `album=${track.album}`,
    );
    if (lyrics) {
      ffmpegArgs.push("-metadata", `lyrics=${lyrics}`);
    }
    ffmpegArgs.push("-y", outputPath);

    try {
      await execFileAsync("ffmpeg", ffmpegArgs, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      // Fallback: try converting without metadata/art
      try {
        await execFileAsync(
          "ffmpeg",
          ["-y", "-i", inputPath, "-c:a", "libmp3lame", "-b:a", "320k", outputPath],
          { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
        );
      } catch {
        // ffmpeg completely unavailable — serve raw audio
        const ext = audio.format === "webm" ? "webm" : "mp3";
        const mimeType = audio.format === "webm" ? "audio/webm" : "audio/mpeg";
        const filename = `${track.artist} - ${track.name}.${ext}`;
        return new NextResponse(new Uint8Array(audio.buffer), {
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
            "Content-Length": audio.buffer.length.toString(),
            "X-Audio-Source": audio.source,
            "X-Audio-Quality": `${audio.bitrate}`,
          },
        });
      }
    }

    const outputBuffer = await readFile(outputPath);
    const filename = `${track.artist} - ${track.name}.mp3`;

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": outputBuffer.length.toString(),
        "X-Audio-Source": audio.source,
        "X-Audio-Quality": `${audio.bitrate}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      try {
        const files = await readdir(tempDir);
        await Promise.all(files.map((f) => unlink(join(tempDir!, f))));
        await rmdir(tempDir);
      } catch {
        // Best effort cleanup
      }
    }
  }
}
