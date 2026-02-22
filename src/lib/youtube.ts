import type { TrackInfo } from "./spotify";

const PIPED_API = process.env.PIPED_API_URL || "https://pipedapi.kavin.rocks";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface SearchOptions {
  artist?: string;
  title?: string;
  durationMs?: number;
}

export async function searchYouTube(query: string, match?: SearchOptions): Promise<string | null> {
  try {
    const res = await fetch(
      `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const items = data.items || [];
    const streams = items.filter(
      (item: { type: string }) => item.type === "stream"
    ) as { url: string; title: string; uploaderName: string; duration: number }[];

    if (streams.length === 0) return null;

    // No match criteria — return first result (legacy behavior)
    if (!match) {
      return streams[0].url.replace("/watch?v=", "");
    }

    const normTitle = match.title ? normalize(match.title) : null;
    const normArtist = match.artist ? normalize(match.artist) : null;
    const targetDurationS = match.durationMs ? match.durationMs / 1000 : null;

    // Score each result
    let bestScore = -1;
    let bestVideo = streams[0]; // fallback to first

    for (const video of streams) {
      let score = 0;
      const vidTitle = normalize(video.title);
      const vidUploader = normalize(video.uploaderName || "");

      // Title contains the track name
      if (normTitle && vidTitle.includes(normTitle)) score += 3;

      // Uploader or video title contains artist name
      if (normArtist) {
        if (vidUploader.includes(normArtist)) score += 3;
        else if (vidTitle.includes(normArtist)) score += 2;
      }

      // Duration within 5s tolerance
      if (targetDurationS && video.duration > 0) {
        const diff = Math.abs(video.duration - targetDurationS);
        if (diff <= 2) score += 4;
        else if (diff <= 5) score += 2;
        else if (diff > 15) score -= 3; // significant mismatch, penalize
      }

      if (score > bestScore) {
        bestScore = score;
        bestVideo = video;
      }
    }

    console.log("[youtube] best match:", bestVideo.title, "by", bestVideo.uploaderName, `(score: ${bestScore}, duration: ${bestVideo.duration}s)`);

    return bestVideo.url.replace("/watch?v=", "");
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
    explicit: false,
    trackNumber: null,
    discNumber: null,
    label: null,
    copyright: null,
    totalTracks: null,
  };
}
