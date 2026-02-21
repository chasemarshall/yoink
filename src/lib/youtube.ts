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
