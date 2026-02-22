import { execFile } from "child_process";
import { promisify } from "util";
import { fetchMusixmatchLyrics } from "./musixmatch";

const execFileAsync = promisify(execFile);

// lrclib blocks Node's TLS fingerprint, so we use curl instead
async function curlJson(url: string): Promise<unknown> {
  const { stdout } = await execFileAsync("curl", [
    "-s", "--max-time", "5",
    "-H", "User-Agent: yoink/1.0 (https://yoinkify.lol)",
    url,
  ], { timeout: 6000 });
  return JSON.parse(stdout);
}

async function fetchFromLrclib(
  artist: string,
  title: string
): Promise<string | null> {
  // Try exact match first
  try {
    const data = await curlJson(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    ) as { syncedLyrics?: string; plainLyrics?: string };
    const lyrics = data.syncedLyrics || data.plainLyrics || null;
    if (lyrics) return lyrics;
  } catch {
    // Fall through to search
  }

  // Fall back to search endpoint (more forgiving matching)
  try {
    const results = await curlJson(
      `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    ) as { syncedLyrics?: string; plainLyrics?: string }[];
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
