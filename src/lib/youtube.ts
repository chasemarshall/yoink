import type { TrackInfo } from "./spotify";

const PIPED_API = process.env.PIPED_API_URL || "https://pipedapi.kavin.rocks";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface SearchOptions {
  artist?: string;
  title?: string;
  album?: string;
  durationMs?: number;
}

// Minimum score to accept a YouTube match (must have at least title + duration or artist match)
const MIN_SCORE = 5;

interface ScoredResult {
  url: string;
  title: string;
  uploaderName: string;
  duration: number;
  score: number;
}

function scoreResults(
  streams: { url: string; title: string; uploaderName: string; duration: number }[],
  match: SearchOptions
): ScoredResult[] {
  const normTitle = match.title ? normalize(match.title) : null;
  const normArtist = match.artist ? normalize(match.artist) : null;
  const targetDurationS = match.durationMs ? match.durationMs / 1000 : null;

  return streams.map((video) => {
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

    // Duration matching
    if (targetDurationS && video.duration > 0) {
      const diff = Math.abs(video.duration - targetDurationS);
      if (diff <= 2) score += 4;
      else if (diff <= 5) score += 2;
      else if (diff > 15) score -= 3;
    }

    return { ...video, score };
  }).sort((a, b) => b.score - a.score);
}

async function pipedSearch(query: string): Promise<{ url: string; title: string; uploaderName: string; duration: number }[]> {
  const res = await fetch(
    `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items = data.items || [];
  return items.filter(
    (item: { type: string }) => item.type === "stream"
  ) as { url: string; title: string; uploaderName: string; duration: number }[];
}

export async function searchYouTube(query: string, match?: SearchOptions): Promise<string | null> {
  try {
    const streams = await pipedSearch(query);
    if (streams.length === 0) return null;

    // No match criteria — return first result (legacy behavior)
    if (!match) {
      return streams[0].url.replace("/watch?v=", "");
    }

    const scored = scoreResults(streams, match);
    const best = scored[0];

    console.log("[youtube] search:", query, `— top result: "${best.title}" by ${best.uploaderName} (score: ${best.score}, duration: ${best.duration}s)`);

    // If score is good enough, use it
    if (best.score >= MIN_SCORE) {
      return best.url.replace("/watch?v=", "");
    }

    // Try a more specific search with album name
    if (match.album) {
      console.log("[youtube] score too low, retrying with album:", match.album);
      const refinedQuery = `${match.artist} - ${match.title} ${match.album}`;
      const refinedStreams = await pipedSearch(refinedQuery);
      if (refinedStreams.length > 0) {
        const refinedScored = scoreResults(refinedStreams, match);
        const refinedBest = refinedScored[0];
        console.log("[youtube] refined result: \"" + refinedBest.title + "\" by", refinedBest.uploaderName, `(score: ${refinedBest.score}, duration: ${refinedBest.duration}s)`);
        if (refinedBest.score >= MIN_SCORE) {
          return refinedBest.url.replace("/watch?v=", "");
        }
        // Use the better of the two even if below threshold
        if (refinedBest.score > best.score) {
          console.log("[youtube] using refined result (best available)");
          return refinedBest.url.replace("/watch?v=", "");
        }
      }
    }

    // Last resort: if nothing scored well, reject rather than serve the wrong song
    if (best.score < 2) {
      console.log("[youtube] no good match found — rejecting all results");
      return null;
    }

    console.log("[youtube] using best available match (below ideal threshold)");
    return best.url.replace("/watch?v=", "");
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
