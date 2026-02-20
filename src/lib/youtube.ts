const PIPED_API = "https://pipedapi.kavin.rocks";

export async function searchYouTube(query: string): Promise<string | null> {
  console.log("[youtube] Searching Piped for:", query);

  try {
    const res = await fetch(
      `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) {
      console.error("[youtube] Piped search failed:", res.status);
      return null;
    }

    const data = await res.json();
    const items = data.items || [];
    const video = items.find(
      (item: { type: string }) => item.type === "stream"
    );

    if (video?.url) {
      const videoId = video.url.replace("/watch?v=", "");
      console.log("[youtube] Found video:", videoId);
      return videoId;
    }

    console.error("[youtube] No results found");
    return null;
  } catch (err) {
    console.error("[youtube] Search error:", err);
    return null;
  }
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  console.log("[youtube] Fetching streams for:", videoId);

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

  // Pick the highest bitrate audio stream
  const best = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
  console.log("[youtube] Best audio stream:", best.mimeType, best.bitrate, "bps");

  return best.url;
}
