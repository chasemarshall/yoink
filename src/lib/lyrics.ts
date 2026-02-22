import { fetchMusixmatchLyrics } from "./musixmatch";

/**
 * Strip LRC timestamp markers (e.g. [00:12.34]) from synced lyrics so that
 * embedded metadata tags (©lyr in M4A, USLT in MP3) contain plain text that
 * Apple Music and other players can display without showing the raw markers.
 */
function stripLrcTimestamps(lrc: string): string {
  return lrc
    .split("\n")
    .map((line) => line.replace(/^\[[\d:.]+\]\s?/, ""))
    .filter((line) => line.trim() !== "")
    .join("\n");
}

async function fetchFromLrclib(
  artist: string,
  title: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;

    const data = await res.json();

    // Prefer synced lyrics but strip timestamps so players show plain text.
    // Fall back to already-plain plainLyrics.
    if (data.syncedLyrics) return stripLrcTimestamps(data.syncedLyrics);
    return data.plainLyrics || null;
  } catch {
    return null;
  }
}

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<string | null> {
  // Try LRCLib first (free, no token needed)
  const lrclib = await fetchFromLrclib(artist, title);
  if (lrclib) return lrclib;

  // Fall back to Musixmatch
  const mxm = await fetchMusixmatchLyrics(artist, title);
  if (mxm) return mxm;

  return null;
}
