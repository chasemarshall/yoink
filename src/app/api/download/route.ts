import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink, readdir, mkdtemp, rmdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

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
      return NextResponse.json({ error: "Invalid Spotify track URL" }, { status: 400 });
    }

    // Check if spotdl is available
    try {
      const { stdout: spotdlVersion } = await execAsync("spotdl --version", { timeout: 10000 });
      console.log("[download] spotdl version:", spotdlVersion.trim());
    } catch (e) {
      console.error("[download] spotdl not found on PATH:", e);
      return NextResponse.json({ error: "spotdl is not installed on the server" }, { status: 500 });
    }

    tempDir = await mkdtemp(join(tmpdir(), "spotdl-"));
    console.log("[download] Temp dir:", tempDir);

    console.log("[download] Starting spotdl download...");
    const { stdout, stderr } = await execAsync(
      `spotdl download "${url}" --output "${tempDir}/{artist} - {title}.{output-ext}"`,
      { timeout: 120000 }
    );
    console.log("[download] spotdl stdout:", stdout);
    if (stderr) console.log("[download] spotdl stderr:", stderr);

    const files = await readdir(tempDir);
    console.log("[download] Files in temp dir:", files);
    const mp3File = files.find((f) => f.endsWith(".mp3"));

    if (!mp3File) {
      console.error("[download] No MP3 file found. Files:", files);
      throw new Error("Download failed — no MP3 file produced");
    }

    const filePath = join(tempDir, mp3File);
    const fileBuffer = await readFile(filePath);
    console.log("[download] File size:", fileBuffer.length, "bytes");

    await unlink(filePath).catch(() => {});

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(mp3File)}"`,
        "Content-Length": fileBuffer.length.toString(),
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
