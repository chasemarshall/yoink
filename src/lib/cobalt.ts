const COBALT_API = "https://api.cobalt.tools";

interface CobaltResponse {
  status: "tunnel" | "redirect" | "picker" | "error";
  url?: string;
  error?: string;
}

export async function getAudioDownloadUrl(
  youtubeUrl: string
): Promise<string> {
  console.log("[cobalt] Requesting audio for:", youtubeUrl);

  const res = await fetch(COBALT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: youtubeUrl,
      downloadMode: "audio",
      audioFormat: "mp3",
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[cobalt] API error:", res.status, text);
    throw new Error(`Cobalt API error: ${res.status}`);
  }

  const data: CobaltResponse = await res.json();
  console.log("[cobalt] Response status:", data.status);

  if (data.status === "error") {
    throw new Error(`Cobalt error: ${data.error || "Unknown error"}`);
  }

  if (!data.url) {
    throw new Error("Cobalt returned no download URL");
  }

  return data.url;
}

export async function downloadAudio(url: string): Promise<Buffer> {
  console.log("[cobalt] Downloading audio from tunnel/redirect URL...");

  const res = await fetch(url, {
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    throw new Error(`Failed to download audio: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  console.log("[cobalt] Downloaded", arrayBuffer.byteLength, "bytes");
  return Buffer.from(arrayBuffer);
}
