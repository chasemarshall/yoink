import { request } from "https";
import { fetchMusixmatchLyrics } from "./musixmatch";

// lrclib blocks Node's fetch/undici TLS fingerprint, so we use the https module
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error("timeout"));
    }, 5000);
    const req = request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          clearTimeout(timer);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }
    );
    req.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    req.end();
  });
}

async function fetchFromLrclib(
  artist: string,
  title: string
): Promise<string | null> {
  // Try exact match first
  try {
    const raw = await httpsGet(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    );
    const data = JSON.parse(raw);
    const lyrics = data.syncedLyrics || data.plainLyrics || null;
    if (lyrics) return lyrics;
  } catch {
    // Fall through to search
  }

  // Fall back to search endpoint (more forgiving matching)
  try {
    const raw = await httpsGet(
      `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    );
    const results = JSON.parse(raw);
    if (!Array.isArray(results) || results.length === 0) return null;

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
  const lrclib = await fetchFromLrclib(artist, title);
  if (lrclib) return lrclib;

  const mxm = await fetchMusixmatchLyrics(artist, title);
  if (mxm) return mxm;

  return null;
}
