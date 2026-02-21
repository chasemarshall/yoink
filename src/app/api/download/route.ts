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
import { searchYouTube, getAudioStreamUrl } from "@/lib/youtube";
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

const ALLOWED_AUDIO_HOSTS = [
  "googlevideo.com",
  "youtube.com",
  "pipedproxy.kavin.rocks",
  "pipedproxy.adminforge.de",
  "withmilo.xyz",
];

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
    const { allowed, retryAfter } = rateLimit(`dl:${ip}`, 3, 60_000);
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

    // Step 2: Search YouTube + fetch lyrics in parallel
    const query = `${track.artist} - ${track.name}`;
    const [videoId, lyrics] = await Promise.all([
      searchYouTube(query),
      fetchLyrics(track.artist, track.name),
    ]);

    if (!videoId) {
      throw new Error("Could not find this track on YouTube");
    }

    // Step 3: Get audio stream URL from Piped
    const audioUrl = await getAudioStreamUrl(videoId);

    if (!isAllowedUrl(audioUrl, ALLOWED_AUDIO_HOSTS)) {
      throw new Error("Audio source URL is not from an allowed host");
    }

    const audioRes = await fetch(audioUrl, {
      signal: AbortSignal.timeout(60000),
    });

    if (!audioRes.ok) {
      throw new Error(`Audio download failed: ${audioRes.status}`);
    }

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    if (audioBuffer.length === 0) {
      throw new Error("Downloaded audio is empty");
    }

    // Step 4: Embed metadata using ffmpeg
    tempDir = await mkdtemp(join(tmpdir(), "dl-"));
    const inputPath = join(tempDir, "input.webm");
    const outputPath = join(tempDir, "output.mp3");
    const artPath = join(tempDir, "cover.jpg");

    await writeFile(inputPath, audioBuffer);

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

    // Build ffmpeg args as array — no shell interpolation, no injection
    const ffmpegArgs: string[] = [];
    ffmpegArgs.push("-i", inputPath);
    if (hasArt) {
      ffmpegArgs.push("-i", artPath, "-map", "0:a", "-map", "1:0");
    }
    ffmpegArgs.push("-c:a", "libmp3lame", "-b:a", "320k");
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
    } catch (ffmpegError) {
      // Fallback: try converting without metadata/art (ffmpeg might still work for format conversion)
      try {
        await execFileAsync(
          "ffmpeg",
          ["-y", "-i", inputPath, "-c:a", "libmp3lame", "-b:a", "320k", outputPath],
          { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
        );
      } catch {
        // ffmpeg completely unavailable — serve raw audio as webm
        const filename = `${track.artist} - ${track.name}.webm`;
        return new NextResponse(new Uint8Array(audioBuffer), {
          headers: {
            "Content-Type": "audio/webm",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
            "Content-Length": audioBuffer.length.toString(),
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
