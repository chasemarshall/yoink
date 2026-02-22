import { fetchMusixmatchLyrics } from "./musixmatch";

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

    // Prefer synced lyrics (LRC format), fall back to plain text
    return data.syncedLyrics || data.plainLyrics || null;
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
