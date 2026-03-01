// Deezer public API metadata fallback — no auth needed, generous rate limits
// Used when Spotify API is rate limited
// NOTE: This file only uses Deezer's public REST API. No authentication, no DRM.

import type { TrackInfo } from "./spotify";
import { extractTrackId, extractAlbumId, extractPlaylistId } from "./spotify";
import type { PlaylistInfo } from "./spotify";

function formatDuration(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deezerTrackToTrackInfo(t: any, albumData?: any): TrackInfo {
  return {
    name: t.title || t.title_short || "",
    artist: t.artist?.name || "",
    albumArtist: albumData?.artist?.name || t.artist?.name || null,
    album: t.album?.title || albumData?.title || "",
    albumArt: t.album?.cover_xl || t.album?.cover_big || albumData?.cover_xl || "",
    duration: formatDuration(t.duration || 0),
    durationMs: (t.duration || 0) * 1000,
    isrc: t.isrc || null,
    genre: null,
    releaseDate: t.release_date || albumData?.release_date || null,
    spotifyUrl: "", // no spotify URL available in fallback
    previewUrl: t.preview || null,
    explicit: t.explicit_lyrics ?? false,
    trackNumber: t.track_position ?? null,
    discNumber: t.disk_number ?? null,
    label: albumData?.label || null,
    copyright: null,
    totalTracks: albumData?.nb_tracks ?? null,
  };
}

// Look up a track on Deezer using a Spotify track ID via ISRC or search
export async function getDeezerTrackBySpotifyUrl(url: string): Promise<TrackInfo | null> {
  const trackId = extractTrackId(url);
  if (!trackId) return null;

  try {
    // Try oEmbed to get title quickly (works without API)
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    let searchQuery = "";
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      const title = oembed.title || "";
      const artist = oembed.author_name || "";
      // Include artist name for much better accuracy on niche artists
      searchQuery = artist ? `${artist} ${title}` : title;
      console.log(`[deezer-fallback] got oEmbed: ${searchQuery}`);
    }

    if (!searchQuery) return null;

    // Search Deezer
    const searchRes = await fetch(
      `https://api.deezer.com/2.0/search/track?q=${encodeURIComponent(searchQuery)}&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const results = searchData.data || [];
    if (results.length === 0) return null;

    // Use first result — oEmbed title is usually very accurate
    const best = results[0];
    console.log(`[deezer-fallback] matched: ${best.artist?.name} - ${best.title}`);

    // Fetch full track details for ISRC etc
    const detailRes = await fetch(
      `https://api.deezer.com/2.0/track/${best.id}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (detailRes.ok) {
      const detail = await detailRes.json();
      if (!detail.error) {
        return deezerTrackToTrackInfo(detail);
      }
    }

    return deezerTrackToTrackInfo(best);
  } catch (e) {
    console.error("[deezer-fallback] track lookup error:", e);
    return null;
  }
}

// Get album metadata from Deezer
export async function getDeezerAlbumBySpotifyUrl(url: string): Promise<PlaylistInfo | null> {
  const albumId = extractAlbumId(url);
  if (!albumId) return null;

  try {
    // Try song.link first — resolves Spotify album IDs to Deezer IDs directly (much more reliable than text search)
    let deezerAlbumId: string | null = null;
    try {
      const songlinkRes = await fetch(
        `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=US`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (songlinkRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await songlinkRes.json();
        const deezerEntity = data.linksByPlatform?.deezer;
        if (deezerEntity?.entityUniqueId) {
          const deezerData = data.entitiesByUniqueId?.[deezerEntity.entityUniqueId];
          if (deezerData?.id) {
            deezerAlbumId = String(deezerData.id);
            console.log(`[deezer-fallback] album resolved via song.link: ${deezerAlbumId}`);
          }
        }
      }
    } catch {
      // song.link failed, fall through to text search
    }

    // Fall back to text search if song.link didn't find it
    if (!deezerAlbumId) {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!oembedRes.ok) return null;
      const oembed = await oembedRes.json();
      let searchQuery = oembed.title || "";
      if (!searchQuery) return null;

      const artist = oembed.author_name || "";
      if (artist) searchQuery = `${artist} ${searchQuery}`;
      console.log(`[deezer-fallback] album oEmbed fallback: ${searchQuery}`);

      const searchRes = await fetch(
        `https://api.deezer.com/2.0/search/album?q=${encodeURIComponent(searchQuery)}&limit=5`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const albums: any[] = searchData.data || [];
      if (albums.length === 0) return null;

      // Validate: find the closest title match, don't blindly take [0]
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedQuery = normalize(searchQuery);
      const exact = albums.find((a) => normalize(a.title) === normalizedQuery);
      const best = exact ?? albums[0];

      // Reject if titles share no meaningful overlap
      const normalizedBest = normalize(best.title);
      if (!normalizedBest.includes(normalizedQuery) && !normalizedQuery.includes(normalizedBest)) {
        console.log(`[deezer-fallback] album text search: no match for "${searchQuery}", closest was "${best.title}" — bailing`);
        return null;
      }

      deezerAlbumId = String(best.id);
    }

    // Fetch full album with tracks
    const albumRes = await fetch(
      `https://api.deezer.com/2.0/album/${deezerAlbumId}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!albumRes.ok) return null;
    const albumData = await albumRes.json();
    if (albumData.error) return null;

    console.log(`[deezer-fallback] album fetched: ${albumData.title} (${albumData.tracks?.data?.length || 0} tracks)`);

    const tracks: TrackInfo[] = (albumData.tracks?.data || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => deezerTrackToTrackInfo(t, albumData)
    );

    return {
      name: albumData.title || "",
      image: albumData.cover_xl || albumData.cover_big || "",
      tracks,
    };
  } catch (e) {
    console.error("[deezer-fallback] album lookup error:", e);
    return null;
  }
}

// Fetch track metadata by Deezer ID (public API, no auth)
export async function fetchDeezerTrackMetadata(deezerId: string): Promise<{
  name: string; artist: string; albumArtist: string | null; album: string;
  albumArt: string; duration: string; durationMs: number; isrc: string | null;
  genre: string | null; releaseDate: string | null; explicit: boolean;
  trackNumber: number | null; discNumber: number | null; totalTracks: number | null;
} | null> {
  try {
    const res = await fetch(`https://api.deezer.com/2.0/track/${deezerId}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const durationMs = (data.duration || 0) * 1000;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return {
      name: data.title || "Unknown", artist: data.artist?.name || "Unknown",
      albumArtist: data.artist?.name || null, album: data.album?.title || "Unknown",
      albumArt: data.album?.cover_xl || data.album?.cover_big || "",
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`, durationMs,
      isrc: data.isrc || null, genre: null, releaseDate: data.release_date || null,
      explicit: data.explicit_lyrics || false, trackNumber: data.track_position ?? null,
      discNumber: data.disk_number ?? null, totalTracks: null,
    };
  } catch { return null; }
}

// Get playlist metadata from Deezer via song.link
export async function getDeezerPlaylistBySpotifyUrl(url: string): Promise<PlaylistInfo | null> {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) return null;

  try {
    // Get playlist title via oEmbed
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!oembedRes.ok) return null;
    const oembed = await oembedRes.json();
    const title = oembed.title || "Playlist";

    console.log(`[deezer-fallback] playlist oEmbed: ${title}`);

    // Playlists don't transfer across platforms well — we can't reliably
    // find the same playlist on Deezer. Return null to let the error propagate.
    // Tracks and albums are the main use case.
    return null;
  } catch {
    return null;
  }
}
