import type { TrackInfo } from "./spotify";

const PIPED_API = process.env.PIPED_API_URL || "https://pipedapi.kavin.rocks";

export async function searchYouTube(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const items = data.items || [];
    const video = items.find(
      (item: { type: string }) => item.type === "stream"
    );

    if (video?.url) {
      return video.url.replace("/watch?v=", "");
    }

    return null;
  } catch {
    return null;
  }
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const res = await fetch(`${PIPED_API}/streams/${videoId}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Piped streams API error: ${res.status}`);
  }

  const data = await res.json();
  const audioStreams: { url: string; mimeType: string; bitrate: number }[] =
    data.audioStreams || [];

  if (audioStreams.length === 0) {
    throw new Error("No audio streams available");
  }

  const best = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
  return best.url;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Parse "Artist - Title" from a YouTube video title
function parseYouTubeTitle(title: string): { artist: string; name: string } {
  // Try "Artist - Title" pattern (most music videos)
  const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+?)(?:\s*[\[(].*)?$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), name: dashMatch[2].trim() };
  }
  return { artist: "Unknown Artist", name: title.trim() };
}

export async function getYouTubeTrackInfo(videoId: string): Promise<TrackInfo> {
  const res = await fetch(`${PIPED_API}/streams/${videoId}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error("Could not fetch YouTube video info");

  const data = await res.json();
  const { artist, name } = parseYouTubeTitle(data.title || "Unknown");

  return {
    name,
    artist: data.uploaderName?.replace(" - Topic", "") || artist,
    album: "",
    albumArt: data.thumbnailUrl || "",
    duration: formatDuration(data.duration || 0),
    durationMs: (data.duration || 0) * 1000,
    isrc: null,
    genre: null,
    releaseDate: data.uploadDate || null,
    spotifyUrl: "", // Will be filled if we find a Spotify match
  };
}
