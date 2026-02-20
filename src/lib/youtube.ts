const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
];

export async function searchYouTube(query: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const items = data.items || [];
      const video = items.find(
        (item: { type: string }) => item.type === "stream"
      );

      if (video?.url) {
        // Piped returns /watch?v=ID format
        const videoId = video.url.replace("/watch?v=", "");
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch {
      continue;
    }
  }
  return null;
}
