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

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function getTrackInfo(url: string) {
  const trackId = extractTrackId(url);
  if (!trackId) throw new Error("Invalid Spotify track URL");

  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Track not found");

  const data = await res.json();

  return {
    name: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
    album: data.album.name,
    albumArt: data.album.images[0]?.url || "",
    duration: formatDuration(data.duration_ms),
    spotifyUrl: data.external_urls.spotify,
  };
}
