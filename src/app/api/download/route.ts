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
import { getTrackInfo } from "@/lib/spotify";
import { searchYouTube, getAudioStreamUrl } from "@/lib/youtube";

const execAsync = promisify(exec);

export const maxDuration = 120;

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

    // Step 2: Search YouTube via Piped
    const query = `${track.artist} - ${track.name}`;
    console.log("[download] Searching YouTube for:", query);
    const videoId = await searchYouTube(query);

    if (!videoId) {
      throw new Error("Could not find this track on YouTube");
    }

    // Step 3: Get audio stream URL from Piped (proxied through your instance)
    const audioUrl = await getAudioStreamUrl(videoId);
    console.log("[download] Downloading audio from Piped proxy...");

    const audioRes = await fetch(audioUrl, {
      signal: AbortSignal.timeout(60000),
    });

    if (!audioRes.ok) {
      throw new Error(`Audio download failed: ${audioRes.status}`);
    }

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
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
        console.log("[download] Fetching album art:", track.albumArt);
        const artRes = await fetch(track.albumArt);
        if (artRes.ok) {
          const artBuffer = Buffer.from(await artRes.arrayBuffer());
          await writeFile(artPath, artBuffer);
          hasArt = true;
          console.log("[download] Album art saved:", artBuffer.length, "bytes");
        } else {
          console.log("[download] Album art fetch failed:", artRes.status);
        }
      } catch (e) {
        console.log("[download] Could not fetch album art:", e);
      }
    }

    // Build ffmpeg command as array and join — avoid shell quoting issues
    const escShell = (s: string) => s.replace(/'/g, "'\\''");

    const ffmpegCmd = hasArt
      ? `ffmpeg -i '${escShell(inputPath)}' -i '${escShell(artPath)}' -map 0:a -map 1:0 -c:a libmp3lame -b:a 192k -c:v copy -id3v2_version 3 -metadata:s:v title='Album cover' -metadata:s:v comment='Cover (front)' -disposition:v attached_pic -metadata title='${escShell(track.name)}' -metadata artist='${escShell(track.artist)}' -metadata album='${escShell(track.album)}' -y '${escShell(outputPath)}'`
      : `ffmpeg -i '${escShell(inputPath)}' -c:a libmp3lame -b:a 192k -id3v2_version 3 -metadata title='${escShell(track.name)}' -metadata artist='${escShell(track.artist)}' -metadata album='${escShell(track.album)}' -y '${escShell(outputPath)}'`;

    console.log("[download] Running ffmpeg (hasArt:", hasArt, ")...");
    console.log("[download] ffmpeg cmd:", ffmpegCmd);
    try {
      const { stdout: ffOut, stderr: ffErr } = await execAsync(ffmpegCmd, { timeout: 60000 });
      if (ffOut) console.log("[download] ffmpeg stdout:", ffOut.slice(0, 300));
      if (ffErr) console.log("[download] ffmpeg stderr:", ffErr.slice(0, 500));
    } catch (e: unknown) {
      const execErr = e as { stderr?: string; message?: string };
      console.error("[download] ffmpeg failed:", execErr.message);
      if (execErr.stderr) console.error("[download] ffmpeg stderr:", execErr.stderr.slice(0, 1000));
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
