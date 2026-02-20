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

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json({ error: "Invalid Spotify track URL" }, { status: 400 });
    }

    tempDir = await mkdtemp(join(tmpdir(), "spotdl-"));

    const { stderr } = await execAsync(
      `spotdl download "${url}" --output "${tempDir}"`,
      { timeout: 120000 }
    );

    const files = await readdir(tempDir);
    const mp3File = files.find((f) => f.endsWith(".mp3"));

    if (!mp3File) {
      console.error("spotdl stderr:", stderr);
      throw new Error("Download failed — no MP3 file produced");
    }

    const filePath = join(tempDir, mp3File);
    const fileBuffer = await readFile(filePath);

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
