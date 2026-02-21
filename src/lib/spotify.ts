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

export function detectUrlType(url: string): "track" | "playlist" | null {
  if (extractTrackId(url)) return "track";
  if (extractPlaylistId(url)) return "playlist";
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
  spotifyUrl: string;
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

  // Fetch genre from primary artist
  let genre: string | null = null;
  try {
    const artistId = data.artists[0]?.id;
    if (artistId) {
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        if (artistData.genres?.length > 0) {
          genre = artistData.genres[0];
        }
      }
    }
  } catch {
    // Skip genre on failure
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
    spotifyUrl: data.external_urls.spotify,
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
    .map((item: { track: { name: string; artists: { id: string; name: string }[]; album: { name: string; images: { url: string }[] }; duration_ms: number; external_ids?: { isrc?: string }; external_urls: { spotify: string } } }) => ({
      name: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url || "",
      duration: formatDuration(item.track.duration_ms),
      durationMs: item.track.duration_ms,
      isrc: item.track.external_ids?.isrc || null,
      genre: genreMap.get(item.track.artists[0]?.id) || null,
      spotifyUrl: item.track.external_urls.spotify,
    }));

  return {
    name: data.name,
    image: data.images?.[0]?.url || "",
    tracks,
  };
}
