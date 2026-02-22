import { fetchMusixmatchLyrics } from "./musixmatch";

async function fetchFromLrclib(
  artist: string,
  title: string
): Promise<string | null> {
  const headers = { "User-Agent": "yoink/1.0 (https://yoinkify.lol)" };

  // Try exact match first
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
      { headers, signal: AbortSignal.timeout(5000) }
    );

    if (res.ok) {
      const data = await res.json();
      const lyrics = data.syncedLyrics || data.plainLyrics || null;
      if (lyrics) return lyrics;
    }
  } catch {
    // Fall through to search
  }

  // Fall back to search endpoint (more forgiving matching)
  try {
    const res = await fetch(
      `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
      { headers, signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Pick the first result that has lyrics, preferring synced
    for (const r of results) {
      if (r.syncedLyrics) return r.syncedLyrics;
    }
    for (const r of results) {
      if (r.plainLyrics) return r.plainLyrics;
    }

    return null;
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
