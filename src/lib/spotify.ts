interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch("https://accounts.spotify.com/api/token", {
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
}

export async function getTrackInfo(url: string): Promise<TrackInfo> {
  const trackId = extractTrackId(url);
  if (!trackId) throw new Error("Invalid Spotify track URL");

  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Track not found");

  const data = await res.json();

  // Fetch genre from primary artist + album details (label/copyright) in parallel
  let genre: string | null = null;
  let label: string | null = null;
  let copyright: string | null = null;
  try {
    const artistId = data.artists[0]?.id;
    const albumId = data.album?.id;

    const [artistResult, albumResult] = await Promise.allSettled([
      artistId
        ? fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),
      albumId
        ? fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : null))
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

  return {
    name: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
    album: data.album.name,
    albumArt: data.album.images[0]?.url || "",
    duration: formatDuration(data.duration_ms),
    durationMs: data.duration_ms,
    isrc: data.external_ids?.isrc || null,
    genre,
    releaseDate: data.album.release_date || null,
    spotifyUrl: data.external_urls.spotify,
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

  const token = await getAccessToken();
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error("Playlist not found");

  const data = await res.json();

  const validItems = data.tracks.items.filter((item: { track: unknown }) => item.track);

  // Batch fetch artist genres (up to 50 per request)
  const genreMap = new Map<string, string>();
  try {
    const artistIds = [...new Set(
      validItems.map((item: { track: { artists: { id: string }[] } }) => item.track.artists[0]?.id).filter(Boolean)
    )] as string[];
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const artistRes = await fetch(`https://api.spotify.com/v1/artists?ids=${batch.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        for (const artist of artistData.artists) {
          if (artist?.genres?.length > 0) {
            genreMap.set(artist.id, artist.genres[0]);
          }
        }
      }
    }
  } catch {
    // Skip genres on failure
  }

  const tracks: TrackInfo[] = validItems
    .map((item: { track: { name: string; artists: { id: string; name: string }[]; album: { name: string; images: { url: string }[]; release_date?: string; total_tracks?: number }; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; explicit?: boolean; track_number?: number; disc_number?: number } }) => ({
      name: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url || "",
      duration: formatDuration(item.track.duration_ms),
      durationMs: item.track.duration_ms,
      isrc: item.track.external_ids?.isrc || null,
      genre: genreMap.get(item.track.artists[0]?.id) || null,
      releaseDate: item.track.album.release_date || null,
      spotifyUrl: item.track.external_urls.spotify,
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

  const token = await getAccessToken();
  const res = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error("Album not found");

  const data = await res.json();

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
      const artistRes = await fetch(`https://api.spotify.com/v1/artists?ids=${batch.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        for (const artist of artistData.artists) {
          if (artist?.genres?.length > 0) {
            genreMap.set(artist.id, artist.genres[0]);
          }
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

  const tracks: TrackInfo[] = validItems
    .map((item: { name: string; artists: { id: string; name: string }[]; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; explicit?: boolean; track_number?: number; disc_number?: number }) => ({
      name: item.name,
      artist: item.artists.map((a) => a.name).join(", "),
      album: albumName,
      albumArt,
      duration: formatDuration(item.duration_ms),
      durationMs: item.duration_ms,
      isrc: item.external_ids?.isrc || null,
      genre: genreMap.get(item.artists[0]?.id) || null,
      releaseDate,
      spotifyUrl: item.external_urls.spotify,
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

export async function getArtistTopTracks(url: string): Promise<PlaylistInfo> {
  const artistId = extractArtistId(url);
  if (!artistId) throw new Error("Invalid Spotify artist URL");

  const token = await getAccessToken();

  const [artistRes, topTracksRes] = await Promise.all([
    fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (!artistRes.ok) throw new Error("Artist not found");
  if (!topTracksRes.ok) throw new Error("Could not fetch artist's top tracks");

  const artistData = await artistRes.json();
  const topTracksData = await topTracksRes.json();

  const artistGenre = artistData.genres?.[0] || null;

  const tracks: TrackInfo[] = topTracksData.tracks.map(
    (track: { name: string; artists: { name: string }[]; album: { name: string; images: { url: string }[]; release_date?: string; total_tracks?: number }; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string }; explicit?: boolean; track_number?: number; disc_number?: number }) => ({
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || "",
      duration: formatDuration(track.duration_ms),
      durationMs: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
      genre: artistGenre,
      releaseDate: track.album.release_date || null,
      spotifyUrl: track.external_urls.spotify,
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
