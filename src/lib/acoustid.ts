import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { TrackInfo } from "./spotify";

const execFileAsync = promisify(execFile);

export interface AcoustIdResult {
  verified: boolean;
  confidence: number;
  matchedTitle?: string;
  matchedArtist?: string;
}

/**
 * Verify a downloaded audio buffer matches the expected track using AcoustID.
 * Requires `fpcalc` binary and ACOUSTID_API_KEY env var.
 * Returns a non-verified result on any failure — never blocks downloads.
 */
export async function verifyTrack(
  buffer: Buffer,
  format: string,
  expectedTrack: TrackInfo
): Promise<AcoustIdResult> {
  const noMatch: AcoustIdResult = { verified: false, confidence: 0 };
  const apiKey = process.env.ACOUSTID_API_KEY;
  if (!apiKey) return noMatch;

  const tempPath = join(tmpdir(), `fpcalc-${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`);

  try {
    await writeFile(tempPath, buffer);

    // Generate fingerprint
    const { stdout: fpcalcOut } = await execFileAsync(
      "fpcalc",
      ["-json", tempPath],
      { timeout: 15000 }
    );

    const fpData = JSON.parse(fpcalcOut);
    if (!fpData.fingerprint || !fpData.duration) return noMatch;

    // Lookup on AcoustID
    const params = new URLSearchParams({
      client: apiKey,
      fingerprint: fpData.fingerprint,
      duration: String(Math.round(fpData.duration)),
      meta: "recordings",
    });

    const res = await fetch(
      `https://api.acoustid.org/v2/lookup?${params.toString()}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return noMatch;

    const data = await res.json();
    if (data.status !== "ok" || !data.results?.length) return noMatch;

    // Check each result for a match
    const expectedTitle = expectedTrack.name.toLowerCase();
    const expectedArtist = expectedTrack.artist.toLowerCase();

    for (const result of data.results) {
      const recordings = result.recordings;
      if (!recordings?.length) continue;

      for (const recording of recordings) {
        const title = (recording.title || "").toLowerCase();
        const artists = (recording.artists || [])
          .map((a: { name: string }) => a.name.toLowerCase());

        const titleMatch =
          title.includes(expectedTitle) || expectedTitle.includes(title);
        const artistMatch = artists.some(
          (a: string) => a.includes(expectedArtist) || expectedArtist.includes(a)
        );

        if (titleMatch && artistMatch) {
          return {
            verified: true,
            confidence: result.score || 0,
            matchedTitle: recording.title,
            matchedArtist: (recording.artists || [])
              .map((a: { name: string }) => a.name)
              .join(", "),
          };
        }
      }
    }

    return noMatch;
  } catch {
    return noMatch;
  } finally {
    try {
      await unlink(tempPath);
    } catch {
      // best effort cleanup
    }
  }
}
