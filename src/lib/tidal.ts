import type { TrackInfo } from "./spotify";

interface TidalToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: TidalToken | null = null;

async function getTidalSession(): Promise<string | null> {
  // Check cached token
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const refreshToken = process.env.TIDAL_REFRESH_TOKEN;
  const clientId = process.env.TIDAL_CLIENT_ID;
  const clientSecret = process.env.TIDAL_CLIENT_SECRET;

  if (!refreshToken || !clientId) {
    return process.env.TIDAL_ACCESS_TOKEN || null;
  }

  try {
    const params: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      scope: "r_usr w_usr",
    };
    if (clientSecret) {
      params.client_secret = clientSecret;
    }

    const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.log("[tidal] token refresh failed:", res.status, errBody);
      console.log("[tidal] client_id length:", clientId.length, "secret length:", clientSecret?.length, "refresh length:", refreshToken.length);
      return process.env.TIDAL_ACCESS_TOKEN || null;
    }

    const data = await res.json();
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in - 60) * 1000,
    };

    return cachedToken.access_token;
  } catch (e) {
    console.error("[tidal] token refresh error:", e);
    return process.env.TIDAL_ACCESS_TOKEN || null;
  }
}

export async function searchTidalByTitleArtist(track: TrackInfo): Promise<string | null> {
  const token = await getTidalSession();
  if (!token) return null;

  try {
    const query = `${track.artist} ${track.name}`;
    const res = await fetch(
      `https://api.tidal.com/v1/search/tracks?query=${encodeURIComponent(query)}&countryCode=US&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.log("[tidal] title search failed:", res.status);
      return null;
    }

    const data = await res.json();
    const items: Array<{ id: number; duration: number }> = data.items || [];

    for (const item of items) {
      if (verifyMatch(item.duration, track)) {
        return String(item.id);
      }
    }

    return null;
  } catch (e) {
    console.error("[tidal] title search error:", e);
    return null;
  }
}

export async function lookupTidalByIsrc(isrc: string): Promise<string | null> {
  const token = await getTidalSession();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://openapi.tidal.com/v2/tracks?filter[isrc]=${encodeURIComponent(isrc)}&countryCode=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.log("[tidal] ISRC lookup failed:", res.status);
      return null;
    }

    const data = await res.json();
    const track = data.data?.[0];
    return track?.id ? String(track.id) : null;
  } catch (e) {
    console.error("[tidal] ISRC lookup error:", e);
    return null;
  }
}

type TidalQuality = "HI_RES_LOSSLESS" | "LOSSLESS" | "HIGH";

export interface TidalAudioResult {
  buffer: Buffer;
  format: "flac" | "mp3";
  bitrate: number;
  quality: TidalQuality;
}

// Map our quality tiers to v2 API format params
const QUALITY_FORMATS: Record<TidalQuality, string[]> = {
  HI_RES_LOSSLESS: ["FLAC_HIRES", "FLAC", "AACLC"],
  LOSSLESS: ["FLAC", "AACLC"],
  HIGH: ["AACLC"],
};

async function getManifest(
  tidalId: string,
  preferHiRes: boolean,
  token: string
): Promise<{ url: string; quality: TidalQuality } | null> {
  // Use the v2 trackManifests endpoint (same as Tidal web player)
  const formats = preferHiRes
    ? ["FLAC_HIRES", "FLAC", "AACLC"]
    : ["FLAC", "AACLC"];

  const params = new URLSearchParams({
    adaptive: "false",
    manifestType: "HLS",
    uriScheme: "DATA",
    usage: "PLAYBACK",
  });
  for (const f of formats) {
    params.append("formats", f);
  }

  try {
    const res = await fetch(
      `https://openapi.tidal.com/v2/trackManifests/${tidalId}?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      console.log("[tidal] v2 manifest failed:", res.status);
      // Fall back to v1 API
      return getManifestV1(tidalId, preferHiRes, token);
    }

    const data = await res.json();
    console.log("[tidal] v2 manifest response keys:", JSON.stringify(Object.keys(data)));
    const attrs = data.data?.attributes;
    console.log("[tidal] v2 manifest attributes:", attrs ? JSON.stringify(Object.keys(attrs)) : "null");
    if (attrs) {
      // Log first 200 chars of each string field to understand structure
      for (const [k, v] of Object.entries(attrs)) {
        const val = typeof v === "string" ? v.substring(0, 200) : v;
        console.log(`[tidal] v2 attr ${k}:`, val);
      }
    }

    if (!attrs) {
      console.log("[tidal] v2 manifest: no attributes");
      // Fall back to v1 API
      return getManifestV1(tidalId, preferHiRes, token);
    }

    // Parse HLS manifest to extract audio URL
    const hlsUrl = extractAudioUrlFromHls(attrs.manifest || attrs.urls?.[0]);
    if (!hlsUrl) {
      console.log("[tidal] v2 manifest: could not extract audio URL, falling back to v1");
      // Fall back to v1 API instead of giving up
      return getManifestV1(tidalId, preferHiRes, token);
    }

    // Determine quality from the codec info
    const codec = attrs.audioCodec || attrs.codecs || "";
    let quality: TidalQuality = "HIGH";
    if (codec === "flac" || codec.includes("flac")) {
      const sampleRate = attrs.audioSamplingRate || attrs.sampleRate || 44100;
      quality = sampleRate > 44100 ? "HI_RES_LOSSLESS" : "LOSSLESS";
    }

    return { url: hlsUrl, quality };
  } catch (e) {
    console.error("[tidal] v2 manifest error:", e);
    return null;
  }
}

function extractAudioUrlFromHls(manifest: string): string | null {
  if (!manifest) return null;

  // If it's a data URI with base64 HLS playlist
  if (manifest.startsWith("data:")) {
    const base64Part = manifest.split(",")[1];
    if (!base64Part) return null;
    const hlsContent = Buffer.from(base64Part, "base64").toString();
    return extractUrlFromM3u8(hlsContent);
  }

  // If it's a direct URL
  if (manifest.startsWith("http")) return manifest;

  // Try parsing as M3U8 content
  return extractUrlFromM3u8(manifest);
}

function extractUrlFromM3u8(content: string): string | null {
  const lines = content.split("\n").map((l) => l.trim());

  // Look for segment URLs or nested playlists
  for (const line of lines) {
    if (line.startsWith("http") && !line.startsWith("#")) {
      return line;
    }
  }

  // For HLS with EXT-X-MAP, extract the URI
  for (const line of lines) {
    const mapMatch = line.match(/EXT-X-MAP:URI="([^"]+)"/);
    if (mapMatch) return mapMatch[1];
  }

  return null;
}

// Fallback: v1 API (works with device-code tokens)
async function getManifestV1(
  tidalId: string,
  preferHiRes: boolean,
  token: string
): Promise<{ url: string; quality: TidalQuality } | null> {
  const qualities: TidalQuality[] = preferHiRes
    ? ["HI_RES_LOSSLESS", "LOSSLESS", "HIGH"]
    : ["LOSSLESS", "HIGH"];

  for (const quality of qualities) {
    try {
      const res = await fetch(
        `https://api.tidal.com/v1/tracks/${tidalId}/playbackinfopostpaywall/v4?audioquality=${quality}&playbackmode=STREAM&assetpresentation=FULL`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!res.ok) {
        console.log(`[tidal] v1 quality ${quality} not available:`, res.status);
        continue;
      }

      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        console.log(`[tidal] v1 quality ${quality}: received XML response, skipping`);
        continue;
      }

      const data = JSON.parse(text);

      if (data.encryptionType && data.encryptionType !== "NONE") {
        console.log(`[tidal] encrypted stream (${data.encryptionType}), skipping`);
        continue;
      }

      // Manifest is base64-encoded JSON
      const manifest = JSON.parse(Buffer.from(data.manifest, "base64").toString());
      const url = manifest.urls?.[0];
      if (!url) continue;

      return { url, quality: data.audioQuality || quality };
    } catch (e) {
      console.error(`[tidal] v1 playback info error (${quality}):`, e);
    }
  }

  return null;
}

function parseTidalDuration(isoDuration: string): number {
  // Parse ISO 8601 duration like "PT3M17S" → seconds
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}

function verifyMatch(tidalDurationSec: number, track: TrackInfo): boolean {
  const durationMs = tidalDurationSec * 1000;
  return Math.abs(durationMs - track.durationMs) <= 5000;
}

export async function fetchTidalAudio(
  tidalId: string,
  track: TrackInfo,
  preferHiRes: boolean
): Promise<TidalAudioResult | null> {
  const token = await getTidalSession();
  if (!token) return null;

  try {
    // Verify track metadata before downloading (v2 API)
    const metaRes = await fetch(
      `https://openapi.tidal.com/v2/tracks/${tidalId}?countryCode=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.api+json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (metaRes.ok) {
      const meta = await metaRes.json();
      const duration = meta.data?.attributes?.duration;
      if (duration) {
        const durationSec = typeof duration === "string"
          ? parseTidalDuration(duration)
          : duration;
        if (!verifyMatch(durationSec, track)) {
          console.log("[tidal] duration mismatch, skipping");
          return null;
        }
      }
    }

    // Get streaming manifest
    const streamInfo = await getManifest(tidalId, preferHiRes, token);
    if (!streamInfo) {
      console.log("[tidal] no available quality tier");
      return null;
    }

    console.log("[tidal] streaming quality:", streamInfo.quality);

    const audioRes = await fetch(streamInfo.url, {
      signal: AbortSignal.timeout(120000),
    });

    if (!audioRes.ok) {
      console.log("[tidal] audio download failed:", audioRes.status);
      return null;
    }

    const buffer = Buffer.from(await audioRes.arrayBuffer());
    if (buffer.length === 0) return null;

    const isFlac = streamInfo.quality === "HI_RES_LOSSLESS" || streamInfo.quality === "LOSSLESS";

    return {
      buffer,
      format: isFlac ? "flac" : "mp3",
      bitrate: isFlac ? 0 : 320,
      quality: streamInfo.quality,
    };
  } catch (e) {
    console.error("[tidal] fetch error:", e);
    return null;
  }
}
