import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
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
import ytdl from "@distube/ytdl-core";
import { getTrackInfo } from "@/lib/spotify";
import { searchYouTube } from "@/lib/youtube";

const execAsync = promisify(exec);

export const maxDuration = 120;

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const { url } = await request.json();
    console.log("[download] Request received for:", url);

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json(
        { error: "Invalid Spotify track URL" },
        { status: 400 }
      );
    }

    // Step 1: Get track metadata from Spotify
    console.log("[download] Fetching Spotify metadata...");
    const track = await getTrackInfo(url);
    console.log("[download] Track:", track.artist, "-", track.name);

    // Step 2: Search YouTube for the track
    const query = `${track.artist} - ${track.name} audio`;
    console.log("[download] Searching YouTube for:", query);
    const youtubeUrl = await searchYouTube(query);

    if (!youtubeUrl) {
      throw new Error("Could not find this track on YouTube");
    }
    console.log("[download] Found YouTube URL:", youtubeUrl);

    // Step 3: Download audio from YouTube using ytdl-core
    console.log("[download] Downloading audio with ytdl-core...");
    const audioStream = ytdl(youtubeUrl, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    const audioBuffer = await streamToBuffer(audioStream);
    console.log("[download] Downloaded", audioBuffer.length, "bytes");

    if (audioBuffer.length === 0) {
      throw new Error("Downloaded audio is empty");
    }

    // Step 4: Embed metadata using ffmpeg
    tempDir = await mkdtemp(join(tmpdir(), "dl-"));
    const inputPath = join(tempDir, "input.webm");
    const outputPath = join(tempDir, "output.mp3");
    const artPath = join(tempDir, "cover.jpg");

    await writeFile(inputPath, audioBuffer);

    // Download album art
    let hasArt = false;
    if (track.albumArt) {
      try {
        const artRes = await fetch(track.albumArt);
        if (artRes.ok) {
          const artBuffer = Buffer.from(await artRes.arrayBuffer());
          await writeFile(artPath, artBuffer);
          hasArt = true;
        }
      } catch {
        console.log("[download] Could not fetch album art, skipping");
      }
    }

    // Escape metadata values for ffmpeg
    const escMeta = (s: string) => s.replace(/"/g, '\\"').replace(/\\/g, "\\\\");

    const ffmpegArgs = [
      "ffmpeg",
      "-i", `"${inputPath}"`,
      ...(hasArt ? ["-i", `"${artPath}"`] : []),
      "-map", "0:a",
      ...(hasArt ? ["-map", "1:0", "-c:v", "mjpeg", "-disposition:v:0", "attached_pic"] : []),
      "-c:a", "libmp3lame",
      "-b:a", "192k",
      `-metadata`, `title="${escMeta(track.name)}"`,
      `-metadata`, `artist="${escMeta(track.artist)}"`,
      `-metadata`, `album="${escMeta(track.album)}"`,
      ...(hasArt ? [`-metadata:s:v`, `title="Album cover"`, `-metadata:s:v`, `comment="Cover (front)"`] : []),
      "-y", `"${outputPath}"`,
    ].join(" ");

    console.log("[download] Running ffmpeg...");
    try {
      await execAsync(ffmpegArgs, { timeout: 60000 });
    } catch (e) {
      console.error("[download] ffmpeg error:", e);
      // Fallback: serve raw audio without metadata
      const filename = `${track.artist} - ${track.name}.mp3`;
      return new NextResponse(new Uint8Array(audioBuffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": audioBuffer.length.toString(),
        },
      });
    }

    const outputBuffer = await readFile(outputPath);
    const filename = `${track.artist} - ${track.name}.mp3`;
    console.log("[download] Success! File size:", outputBuffer.length, "bytes");

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    console.error("[download] Error:", message);
    if (error instanceof Error && error.stack) {
      console.error("[download] Stack:", error.stack);
    }
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
