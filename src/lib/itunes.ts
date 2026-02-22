import type { TrackInfo } from "./spotify";

/**
 * Extract an Apple Music track ID from a URL.
 * Supports both `?i=TRACK_ID` query param and `/song/name/ID` path formats.
 */
export function extractAppleMusicTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // ?i=TRACK_ID (most common for individual tracks within albums)
    const iParam = parsed.searchParams.get("i");
    if (iParam && /^\d+$/.test(iParam)) return iParam;

    // /song/name/ID or /album/name/ID (last numeric path segment)
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /^\d+$/.test(last)) return last;

    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a track by iTunes ID and map to TrackInfo.
 */
export async function lookupByItunesId(trackId: string): Promise<TrackInfo | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.results?.[0];
    if (!result || result.wrapperType !== "track") return null;

    const durationMs = result.trackTimeMillis || 0;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    // Swap artwork to 600x600
    const albumArt = result.artworkUrl100
      ? result.artworkUrl100.replace("100x100", "600x600")
      : "";

    return {
      name: result.trackName || "Unknown",
      artist: result.artistName || "Unknown",
      album: result.collectionName || "Unknown",
      albumArt,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      durationMs,
      isrc: null,
      genre: result.primaryGenreName || null,
      releaseDate: result.releaseDate ? result.releaseDate.split("T")[0] : null,
      spotifyUrl: "",
      explicit: result.trackExplicitness === "explicit",
      trackNumber: null,
      discNumber: null,
      label: null,
      copyright: null,
      totalTracks: null,
    };
  } catch {
    return null;
  }
}
