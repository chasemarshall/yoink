// Use YouTube's internal Innertube API for search — no third-party proxies needed
export async function searchYouTube(query: string): Promise<string | null> {
  console.log("[youtube] Searching Innertube for:", query);

  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20241126.01.00",
              hl: "en",
              gl: "US",
            },
          },
          query: query,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      console.error("[youtube] Innertube search failed:", res.status);
      return null;
    }

    const data = await res.json();

    // Navigate the nested response structure to find video results
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    if (!contents) {
      console.error("[youtube] Unexpected response structure");
      return null;
    }

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        const videoId = item?.videoRenderer?.videoId;
        if (videoId) {
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          console.log("[youtube] Found:", url);
          return url;
        }
      }
    }

    console.error("[youtube] No video results found");
    return null;
  } catch (err) {
    console.error("[youtube] Search error:", err);
    return null;
  }
}
