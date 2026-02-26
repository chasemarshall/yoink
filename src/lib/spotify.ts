interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: SpotifyToken | null = null;

// Spotify API rate limit handling
let rateLimitResetAt = 0;

function formatRetry(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const mins = Math.ceil(secs / 60);
  return `~${mins} min`;
}

// Wraps fetch with rate limit tracking + retry with backoff
async function spotifyFetch(url: string, init?: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Fast-fail if we're in a known rate limit window
    const now = Date.now();
    if (now < rateLimitResetAt) {
      const secsLeft = Math.ceil((rateLimitResetAt - now) / 1000);
      throw new Error(`Spotify is rate limited — try again in ${formatRetry(secsLeft)}`);
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(15000), ...init });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
      console.log(`[spotify] 429 on ${url.split("/v1/")[1]?.split("?")[0] || url}, retry-after=${retryAfter}s (attempt ${attempt + 1}/${maxRetries + 1})`);

      // If retry-after is short enough and we have retries left, wait and retry
      if (attempt < maxRetries && retryAfter <= 10) {
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // Otherwise, set the global cooldown and throw
      rateLimitResetAt = Date.now() + retryAfter * 1000;
      throw new Error(`Spotify is rate limited — try again in ${formatRetry(retryAfter)}`);
    }

    return res;
  }

  // shouldn't reach here
  return fetch(url, { signal: AbortSignal.timeout(15000), ...init });
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await spotifyFetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get Spotify access token");

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

// Helper to make authenticated Spotify API calls with retry
async function spotifyApi(url: string): Promise<Response> {
  const token = await getAccessToken();
  return spotifyFetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

// --- Response cache (10 min TTL) ---
// Prevents duplicate API calls between metadata + download routes
const apiCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000;

async function cachedSpotifyGet<T>(url: string): Promise<T> {
  const cached = apiCache.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  const res = await spotifyApi(url);
  if (!res.ok) {
    const status = res.status;
    throw new Error(`Spotify API error (${status})`);
  }

  const data = await res.json();
  apiCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL });

  // Evict old entries if cache gets too big
  if (apiCache.size > 500) {
    const now = Date.now();
    for (const [key, val] of apiCache) {
      if (now >= val.expiresAt) apiCache.delete(key);
    }
  }

  return data as T;
}

export function extractTrackId(url: string): string | null {
  const match = url.match(/track[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/playlist[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function extractAlbumId(url: string): string | null {
  const match = url.match(/album[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function extractArtistId(url: string): string | null {
  const match = url.match(/artist[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function detectUrlType(url: string): "track" | "playlist" | "album" | "artist" | null {
  if (extractTrackId(url)) return "track";
  if (extractPlaylistId(url)) return "playlist";
  if (extractAlbumId(url)) return "album";
  if (extractArtistId(url)) return "artist";
  return null;
}

export function detectPlatform(url: string): "spotify" | "apple-music" | "youtube" | null {
  if (url.includes("spotify.com") || url.includes("spotify:")) return "spotify";
  if (url.includes("music.apple.com")) return "apple-music";
  if (url.includes("youtube.com/watch") || url.includes("youtu.be/") || url.includes("music.youtube.com")) return "youtube";
  return null;
}

export function extractYouTubeId(url: string): string | null {
  // youtube.com/watch?v=ID or youtu.be/ID or music.youtube.com/watch?v=ID
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface TrackInfo {
  name: string;
  artist: string;
  albumArtist: string | null;
  album: string;
  albumArt: string;
  duration: string;
  durationMs: number;
  isrc: string | null;
  genre: string | null;
  releaseDate: string | null;
  spotifyUrl: string;
  explicit: boolean;
  trackNumber: number | null;
  discNumber: number | null;
  label: string | null;
  copyright: string | null;
  totalTracks: number | null;
  videoCover?: string;
  previewUrl?: string | null;
}

export async function getTrackInfo(url: string): Promise<TrackInfo> {
  const trackId = extractTrackId(url);
  if (!trackId) throw new Error("Invalid Spotify track URL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await cachedSpotifyGet(`https://api.spotify.com/v1/tracks/${trackId}`);

  // Fetch genre from primary artist + album details (label/copyright) in parallel
  let genre: string | null = null;
  let label: string | null = null;
  let copyright: string | null = null;
  try {
    const artistId = data.artists[0]?.id;
    const albumId = data.album?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [artistResult, albumResult] = await Promise.allSettled([
      artistId
        ? cachedSpotifyGet<any>(`https://api.spotify.com/v1/artists/${artistId}`).catch(() => null)
        : Promise.resolve(null),
      albumId
        ? cachedSpotifyGet<any>(`https://api.spotify.com/v1/albums/${albumId}`).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (artistResult.status === "fulfilled" && artistResult.value?.genres?.length > 0) {
      genre = artistResult.value.genres[0];
    }
    if (albumResult.status === "fulfilled" && albumResult.value) {
      label = albumResult.value.label || null;
      copyright = albumResult.value.copyrights?.[0]?.text || null;
    }
  } catch {
    // Skip on failure
  }

  const albumArtist = data.album.artists?.map((a: { name: string }) => a.name).join(", ") || null;

  return {
    name: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
    albumArtist,
    album: data.album.name,
    albumArt: data.album.images[0]?.url || "",
    duration: formatDuration(data.duration_ms),
    durationMs: data.duration_ms,
    isrc: data.external_ids?.isrc || null,
    genre,
    releaseDate: data.album.release_date || null,
    spotifyUrl: data.external_urls.spotify,
    previewUrl: data.preview_url || null,
    explicit: data.explicit ?? false,
    trackNumber: data.track_number ?? null,
    discNumber: data.disc_number ?? null,
    label,
    copyright,
    totalTracks: data.album.total_tracks ?? null,
  };
}

export interface PlaylistInfo {
  name: string;
  image: string;
  tracks: TrackInfo[];
}

export async function getPlaylistInfo(url: string): Promise<PlaylistInfo> {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) throw new Error("Invalid Spotify playlist URL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await cachedSpotifyGet(`https://api.spotify.com/v1/playlists/${playlistId}`);

  const validItems = data.tracks.items.filter((item: { track: unknown }) => item.track);

  // Batch fetch artist genres (up to 50 per request)
  const genreMap = new Map<string, string>();
  try {
    const artistIds = [...new Set(
      validItems.map((item: { track: { artists: { id: string }[] } }) => item.track.artists[0]?.id).filter(Boolean)
    )] as string[];
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const artistData: any = await cachedSpotifyGet(`https://api.spotify.com/v1/artists?ids=${batch.join(",")}`);
      for (const artist of artistData.artists) {
        if (artist?.genres?.length > 0) {
          genreMap.set(artist.id, artist.genres[0]);
        }
      }
    }
  } catch {
    // Skip genres on failure
  }

  const tracks: TrackInfo[] = validItems
    .map((item: { track: { name: string; artists: { id: string; name: string }[]; album: { name: string; artists?: { name: string }[]; images: { url: string }[]; release_date?: string; total_tracks?: number }; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; preview_url?: string | null; explicit?: boolean; track_number?: number; disc_number?: number } }) => ({
      name: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      albumArtist: item.track.album.artists?.map((a) => a.name).join(", ") || null,
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url || "",
      duration: formatDuration(item.track.duration_ms),
      durationMs: item.track.duration_ms,
      isrc: item.track.external_ids?.isrc || null,
      genre: genreMap.get(item.track.artists[0]?.id) || null,
      releaseDate: item.track.album.release_date || null,
      spotifyUrl: item.track.external_urls.spotify,
      previewUrl: item.track.preview_url || null,
      explicit: item.track.explicit ?? false,
      trackNumber: item.track.track_number ?? null,
      discNumber: item.track.disc_number ?? null,
      label: null,
      copyright: null,
      totalTracks: item.track.album.total_tracks ?? null,
    }));

  return {
    name: data.name,
    image: data.images?.[0]?.url || "",
    tracks,
  };
}

export async function getAlbumInfo(url: string): Promise<PlaylistInfo> {
  const albumId = extractAlbumId(url);
  if (!albumId) throw new Error("Invalid Spotify album URL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await cachedSpotifyGet(`https://api.spotify.com/v1/albums/${albumId}`);

  // Album track items are track objects directly (not wrapped in {track})
  const validItems = data.tracks.items.filter((item: { id: string }) => item.id);

  // Batch fetch artist genres
  const genreMap = new Map<string, string>();
  try {
    const artistIds = [...new Set(
      validItems.map((item: { artists: { id: string }[] }) => item.artists[0]?.id).filter(Boolean)
    )] as string[];
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const artistData: any = await cachedSpotifyGet(`https://api.spotify.com/v1/artists?ids=${batch.join(",")}`);
      for (const artist of artistData.artists) {
        if (artist?.genres?.length > 0) {
          genreMap.set(artist.id, artist.genres[0]);
        }
      }
    }
  } catch {
    // Skip genres on failure
  }

  const albumName = data.name;
  const albumArt = data.images?.[0]?.url || "";
  const releaseDate = data.release_date || null;
  const albumLabel: string | null = data.label || null;
  const albumCopyright: string | null = data.copyrights?.[0]?.text || null;
  const albumTotalTracks: number | null = data.total_tracks ?? null;
  const albumArtist: string | null = data.artists?.map((a: { name: string }) => a.name).join(", ") || null;

  const tracks: TrackInfo[] = validItems
    .map((item: { name: string; artists: { id: string; name: string }[]; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; preview_url?: string | null; explicit?: boolean; track_number?: number; disc_number?: number }) => ({
      name: item.name,
      artist: item.artists.map((a) => a.name).join(", "),
      albumArtist,
      album: albumName,
      albumArt,
      duration: formatDuration(item.duration_ms),
      durationMs: item.duration_ms,
      isrc: item.external_ids?.isrc || null,
      genre: genreMap.get(item.artists[0]?.id) || null,
      releaseDate,
      spotifyUrl: item.external_urls.spotify,
      previewUrl: item.preview_url || null,
      explicit: item.explicit ?? false,
      trackNumber: item.track_number ?? null,
      discNumber: item.disc_number ?? null,
      label: albumLabel,
      copyright: albumCopyright,
      totalTracks: albumTotalTracks,
    }));

  return {
    name: albumName,
    image: albumArt,
    tracks,
  };
}

export async function searchTracks(query: string, limit = 8): Promise<TrackInfo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await cachedSpotifyGet(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
  );
  const items = data.tracks?.items || [];

  return items.map(
    (track: {
      name: string;
      artists: { name: string }[];
      album: { name: string; artists?: { name: string }[]; images: { url: string }[]; release_date?: string; total_tracks?: number };
      duration_ms: number;
      external_ids?: { isrc?: string };
      external_urls: { spotify: string };
      preview_url?: string | null;
      explicit?: boolean;
      track_number?: number;
      disc_number?: number;
    }) => ({
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      albumArtist: track.album.artists?.map((a) => a.name).join(", ") || null,
      album: track.album.name,
      albumArt: track.album.images[0]?.url || "",
      duration: formatDuration(track.duration_ms),
      durationMs: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
      genre: null,
      releaseDate: track.album.release_date || null,
      spotifyUrl: track.external_urls.spotify,
      previewUrl: track.preview_url || null,
      explicit: track.explicit ?? false,
      trackNumber: track.track_number ?? null,
      discNumber: track.disc_number ?? null,
      label: null,
      copyright: null,
      totalTracks: track.album.total_tracks ?? null,
    })
  );
}

export async function getArtistTopTracks(url: string): Promise<PlaylistInfo> {
  const artistId = extractArtistId(url);
  if (!artistId) throw new Error("Invalid Spotify artist URL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [artistData, topTracksData]: any[] = await Promise.all([
    cachedSpotifyGet(`https://api.spotify.com/v1/artists/${artistId}`),
    cachedSpotifyGet(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`),
  ]);

  const artistGenre = artistData.genres?.[0] || null;

  const tracks: TrackInfo[] = topTracksData.tracks.map(
    (track: { name: string; artists: { name: string }[]; album: { name: string; artists?: { name: string }[]; images: { url: string }[]; release_date?: string; total_tracks?: number }; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; preview_url?: string | null; explicit?: boolean; track_number?: number; disc_number?: number }) => ({
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      albumArtist: track.album.artists?.map((a) => a.name).join(", ") || null,
      album: track.album.name,
      albumArt: track.album.images[0]?.url || "",
      duration: formatDuration(track.duration_ms),
      durationMs: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
      genre: artistGenre,
      releaseDate: track.album.release_date || null,
      spotifyUrl: track.external_urls.spotify,
      previewUrl: track.preview_url || null,
      explicit: track.explicit ?? false,
      trackNumber: track.track_number ?? null,
      discNumber: track.disc_number ?? null,
      label: null,
      copyright: null,
      totalTracks: track.album.total_tracks ?? null,
    })
  );

  return {
    name: `${artistData.name} — Top Tracks`,
    image: artistData.images?.[0]?.url || "",
    tracks,
  };
}

// Trending cache — refreshes every hour
let trendingCache: { songs: string[]; expiresAt: number } | null = null;
const TRENDING_PLAYLIST = "37i9dQZEVXbMDoHDwVN2tF"; // Top 50 - Global

export async function getTrending(count = 10): Promise<string[]> {
  if (trendingCache && Date.now() < trendingCache.expiresAt) {
    return trendingCache.songs;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await cachedSpotifyGet(
      `https://api.spotify.com/v1/playlists/${TRENDING_PLAYLIST}/tracks?limit=${count}`,
    );

    const songs = (data.items || [])
      .filter((item: any) => item.track)
      .map((item: any) =>
        `${item.track.artists[0]?.name} - ${item.track.name}`
      );

    if (songs.length === 0) {
      console.error("[trending] no tracks found in playlist response");
      return trendingCache?.songs || [];
    }

    trendingCache = { songs, expiresAt: Date.now() + 60 * 60 * 1000 };
    return songs;
  } catch (err) {
    console.error("[trending] error:", err);
    return trendingCache?.songs || [];
  }
}
