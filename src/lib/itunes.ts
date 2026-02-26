import type { TrackInfo, PlaylistInfo } from "./spotify";

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

export async function searchItunesTrack(artist: string, title: string): Promise<TrackInfo | null> {
  try {
    const query = encodeURIComponent(`${artist} ${title}`.trim());
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;
    const durationMs = result.trackTimeMillis || 0;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const albumArt = result.artworkUrl100?.replace("100x100", "600x600") || "";
    return {
      name: result.trackName || title, artist: result.artistName || artist,
      albumArtist: result.collectionArtistName || result.artistName || null,
      album: result.collectionName || "Unknown", albumArt,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`, durationMs,
      isrc: null, genre: result.primaryGenreName || null,
      releaseDate: result.releaseDate ? result.releaseDate.split("T")[0] : null,
      spotifyUrl: "", explicit: result.trackExplicitness === "explicit",
      trackNumber: result.trackNumber ?? null, discNumber: result.discNumber ?? null,
      label: null, copyright: result.copyright || null, totalTracks: result.trackCount ?? null,
    };
  } catch { return null; }
}

export async function searchItunesAlbum(artist: string, albumName: string): Promise<PlaylistInfo | null> {
  try {
    const query = encodeURIComponent(`${artist} ${albumName}`.trim());
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const albums: any[] = searchData.results || [];
    if (!albums.length) return null;

    // Find best title match
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedAlbum = normalize(albumName);
    const best = albums.find((a) => normalize(a.collectionName) === normalizedAlbum) ?? albums[0];
    if (!normalize(best.collectionName).includes(normalizedAlbum) && !normalizedAlbum.includes(normalize(best.collectionName))) {
      return null;
    }

    // Fetch tracklist
    const tracksRes = await fetch(
      `https://itunes.apple.com/lookup?id=${best.collectionId}&entity=song`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!tracksRes.ok) return null;
    const tracksData = await tracksRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackItems: any[] = (tracksData.results || []).filter((r: any) => r.wrapperType === "track");
    if (!trackItems.length) return null;

    const coverArt = best.artworkUrl100?.replace("100x100bb", "600x600bb") ?? "";

    const tracks: TrackInfo[] = trackItems.map((r) => {
      const durationMs = r.trackTimeMillis || 0;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return {
        name: r.trackName || "Unknown",
        artist: r.artistName || artist,
        albumArtist: best.artistName || artist || null,
        album: best.collectionName || albumName,
        albumArt: coverArt,
        duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        durationMs,
        isrc: null,
        genre: r.primaryGenreName || null,
        releaseDate: r.releaseDate ? r.releaseDate.split("T")[0] : null,
        spotifyUrl: "",
        explicit: r.trackExplicitness === "explicit",
        trackNumber: r.trackNumber ?? null,
        discNumber: r.discNumber ?? null,
        label: null,
        copyright: best.copyright || null,
        totalTracks: best.trackCount ?? null,
      };
    });

    return {
      name: best.collectionName || albumName,
      image: coverArt,
      tracks,
    };
  } catch { return null; }
}

// Given a Spotify URL, fetch the equivalent track from Apple Music via oEmbed
export async function getAppleMusicTrackBySpotifyUrl(spotifyUrl: string): Promise<TrackInfo | null> {
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!oembedRes.ok) return null;
    const oembed = await oembedRes.json();
    const title = oembed.title || "";
    const artist = oembed.author_name || "";
    if (!title) return null;
    console.log(`[apple-music] track fallback: ${artist} - ${title}`);
    return searchItunesTrack(artist, title);
  } catch { return null; }
}

// Given a Spotify URL, fetch the equivalent album from Apple Music via oEmbed
export async function getAppleMusicAlbumBySpotifyUrl(spotifyUrl: string): Promise<PlaylistInfo | null> {
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!oembedRes.ok) return null;
    const oembed = await oembedRes.json();
    const albumName = oembed.title || "";
    const artist = oembed.author_name || "";
    if (!albumName) return null;
    console.log(`[apple-music] album fallback: ${artist} - ${albumName}`);
    return searchItunesAlbum(artist, albumName);
  } catch { return null; }
}
