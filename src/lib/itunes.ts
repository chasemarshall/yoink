import type { TrackInfo } from "./spotify";

export interface ItunesCatalogIds {
  trackId: number;
  collectionId: number;
  artistId: number;
  genreId: number;
}

/**
 * Look up iTunes catalog IDs for a track by artist + title.
 * These IDs are used to write cnID/plID/atID/geID atoms into m4a files
 * so Apple Music recognizes them as catalog matches.
 */
export async function lookupItunesCatalogIds(track: TrackInfo): Promise<ItunesCatalogIds | null> {
  try {
    const query = encodeURIComponent(`${track.artist} ${track.name}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results;
    if (!results?.length) return null;

    // Try to find an exact match by name + artist
    const normalName = track.name.toLowerCase().trim();
    const normalArtist = track.artist.toLowerCase().split(",")[0].trim();
    const match = results.find((r: { trackName?: string; artistName?: string }) =>
      r.trackName?.toLowerCase().trim() === normalName &&
      r.artistName?.toLowerCase().trim().includes(normalArtist)
    ) || results[0];

    if (!match.trackId) return null;

    return {
      trackId: match.trackId,
      collectionId: match.collectionId || 0,
      artistId: match.artistId || 0,
      genreId: match.primaryGenreId || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Look up the iTunes genre for a track by searching artist + track name.
 * Returns the primaryGenreName (track-level genre) or null if not found.
 */
export async function lookupItunesGenre(track: TrackInfo): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${track.artist} ${track.name}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.primaryGenreName || null;
  } catch {
    return null;
  }
}

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
      albumArtist: result.collectionArtistName || result.artistName || null,
      album: result.collectionName || "Unknown",
      albumArt,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      durationMs,
      isrc: null,
      genre: result.primaryGenreName || null,
      releaseDate: result.releaseDate ? result.releaseDate.split("T")[0] : null,
      spotifyUrl: "",
      explicit: result.trackExplicitness === "explicit",
      trackNumber: result.trackNumber ?? null,
      discNumber: result.discNumber ?? null,
      label: null,
      copyright: result.copyright || null,
      totalTracks: result.trackCount ?? null,
    };
  } catch {
    return null;
  }
}
