import { createHash, createDecipheriv, createCipheriv } from "crypto";
import type { TrackInfo } from "./spotify";

const DEEZER_MASTER_KEY = "g4el58wc0zvf9na1";

interface DeezerTrackData {
  SNG_ID: string;
  MD5_ORIGIN: string;
  MEDIA_VERSION: string;
  FILESIZE_MP3_320: string;
  FILESIZE_MP3_128: string;
  FILESIZE_FLAC: string;
  ISRC: string;
  DURATION: string;
  TRACK_TOKEN: string;
}

interface DeezerSession {
  trackData: DeezerTrackData;
  licenseToken: string;
  cookieHeader: string;
}

interface DeezerAudioResult {
  buffer: Buffer;
  format: "mp3" | "flac";
  bitrate: number;
}

function getArlToken(): string | null {
  return process.env.DEEZER_ARL || null;
}

function getBlowfishKey(trackId: string): Buffer {
  const idMd5 = createHash("md5").update(trackId, "ascii").digest("hex");
  const key = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    key[i] =
      idMd5.charCodeAt(i) ^
      idMd5.charCodeAt(i + 16) ^
      DEEZER_MASTER_KEY.charCodeAt(i);
  }
  return key;
}

function decryptChunk(chunk: Buffer, blowfishKey: Buffer): Buffer {
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);
  const decipher = createDecipheriv("bf-cbc", blowfishKey, iv);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(chunk), decipher.final()]);
}

function decryptAudio(encrypted: Buffer, trackId: string): Buffer {
  const blowfishKey = getBlowfishKey(trackId);
  const chunkSize = 2048;
  const chunks: Buffer[] = [];

  for (let i = 0; i < encrypted.length; i += chunkSize) {
    const chunk = encrypted.subarray(i, i + chunkSize);
    // Every third chunk (0-indexed: 0, 3, 6...) is encrypted, only if full size
    if (i % (chunkSize * 3) === 0 && chunk.length === chunkSize) {
      chunks.push(decryptChunk(chunk, blowfishKey));
    } else {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

function buildCdnUrl(
  md5Origin: string,
  mediaVersion: string,
  trackId: string,
  format: 1 | 3 | 9 // 1=MP3_128, 3=MP3_320, 9=FLAC
): string {
  const step1 = [md5Origin, String(format), trackId, mediaVersion].join("\xa4");
  const step1Hash = createHash("md5").update(step1, "ascii").digest("hex");
  const step2 = `${step1Hash}\xa4${step1}\xa4`;
  // Pad to multiple of 16
  const padded = step2 + "\x00".repeat((16 - (step2.length % 16)) % 16);
  const aesKey = Buffer.from("jo6aey6haid2Teih", "ascii");
  const cipher = createCipheriv("aes-128-ecb", aesKey, null as unknown as Buffer);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([
    cipher.update(padded, "ascii"),
    cipher.final(),
  ]);
  return `https://cdns-proxy-${md5Origin[0]}.dzcdn.net/mobile/1/${encrypted.toString("hex")}`;
}

// Alternative: use Deezer's media API to get a direct streaming URL
async function getMediaUrl(
  trackToken: string,
  format: "MP3_128" | "MP3_320" | "FLAC",
  licenseToken: string
): Promise<string | null> {
  try {
    const res = await fetch("https://media.deezer.com/v1/get_url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        license_token: licenseToken,
        media: [
          {
            type: "FULL",
            formats: [{ cipher: "BF_CBC_STRIPE", format }],
          },
        ],
        track_tokens: [trackToken],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const url = data.data?.[0]?.media?.[0]?.sources?.[0]?.url;
    return url || null;
  } catch {
    return null;
  }
}

async function getDeezerSession(
  deezerId: string,
  arl: string
): Promise<DeezerSession | null> {
  try {
    // Get API token + license token first
    const tokenRes = await fetch(
      "https://www.deezer.com/ajax/gw-light.php?method=deezer.getUserData&input=3&api_version=1.0&api_token=",
      {
        headers: { cookie: `arl=${arl}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    console.log("[deezer] getUserData status:", tokenRes.status);
    if (!tokenRes.ok) return null;

    // Capture sid cookie from response for CSRF validation
    const setCookies = tokenRes.headers.getSetCookie?.() || [];
    let sid = "";
    for (const c of setCookies) {
      const match = c.match(/sid=([^;]+)/);
      if (match) {
        sid = match[1];
        break;
      }
    }
    console.log("[deezer] sid cookie:", sid ? "present" : "missing");

    const tokenData = await tokenRes.json();
    const apiToken = tokenData.results?.checkForm;
    const userId = tokenData.results?.USER?.USER_ID;
    const licenseToken = tokenData.results?.USER?.OPTIONS?.license_token || "";
    console.log("[deezer] API token:", apiToken ? "present" : "missing", "USER_ID:", userId, "license_token:", licenseToken ? "present" : "missing");
    if (!apiToken) {
      console.warn("[deezer] ARL token may be expired — no API token returned");
      return null;
    }

    // Build cookie string with both arl and sid
    const cookieHeader = sid ? `arl=${arl}; sid=${sid}` : `arl=${arl}`;

    // Get track data
    const trackRes = await fetch(
      `https://www.deezer.com/ajax/gw-light.php?method=song.getData&input=3&api_version=1.0&api_token=${apiToken}`,
      {
        method: "POST",
        headers: {
          cookie: cookieHeader,
          "content-type": "application/json",
        },
        body: JSON.stringify({ sng_id: deezerId }),
        signal: AbortSignal.timeout(10000),
      }
    );
    console.log("[deezer] song.getData status:", trackRes.status);
    if (!trackRes.ok) return null;

    const trackData = await trackRes.json();
    const r = trackData.results;
    console.log("[deezer] song.getData results keys:", r ? Object.keys(r).slice(0, 10) : "null", "error:", trackData.error);
    if (!r?.SNG_ID || !r?.MD5_ORIGIN) {
      console.log("[deezer] missing SNG_ID or MD5_ORIGIN — SNG_ID:", r?.SNG_ID, "MD5_ORIGIN:", r?.MD5_ORIGIN);
      return null;
    }

    return {
      trackData: {
        SNG_ID: r.SNG_ID,
        MD5_ORIGIN: r.MD5_ORIGIN,
        MEDIA_VERSION: r.MEDIA_VERSION,
        FILESIZE_MP3_320: r.FILESIZE_MP3_320 || "0",
        FILESIZE_MP3_128: r.FILESIZE_MP3_128 || "0",
        FILESIZE_FLAC: r.FILESIZE_FLAC || "0",
        ISRC: r.ISRC || "",
        DURATION: r.DURATION || "0",
        TRACK_TOKEN: r.TRACK_TOKEN || "",
      },
      licenseToken,
      cookieHeader,
    };
  } catch (e) {
    console.error("[deezer] getDeezerSession error:", e);
    return null;
  }
}

function verifyMatch(
  deezerTrack: DeezerTrackData,
  spotifyTrack: TrackInfo
): boolean {
  // ISRC match is the strongest signal
  if (
    spotifyTrack.isrc &&
    deezerTrack.ISRC &&
    spotifyTrack.isrc.toUpperCase() === deezerTrack.ISRC.toUpperCase()
  ) {
    return true;
  }

  // Fallback: duration within 3s tolerance
  const deezerDurationMs = parseInt(deezerTrack.DURATION) * 1000;
  if (Math.abs(deezerDurationMs - spotifyTrack.durationMs) <= 3000) {
    return true;
  }

  return false;
}

// Look up Deezer track ID by ISRC (public API, no auth needed)
export async function lookupDeezerByIsrc(isrc: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/2.0/track/isrc:${encodeURIComponent(isrc)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.id) return null;
    return String(data.id);
  } catch {
    return null;
  }
}

export async function fetchDeezerAudio(
  deezerId: string,
  track: TrackInfo
): Promise<DeezerAudioResult | null> {
  const arl = getArlToken();
  if (!arl) {
    console.log("[deezer] no ARL token set");
    return null;
  }
  console.log("[deezer] ARL token present, length:", arl.length);

  try {
    const session = await getDeezerSession(deezerId, arl);
    if (!session) {
      console.log("[deezer] getDeezerSession returned null — ARL may be expired");
      return null;
    }
    const { trackData, licenseToken } = session;
    console.log("[deezer] got track data:", {
      SNG_ID: trackData.SNG_ID,
      ISRC: trackData.ISRC,
      DURATION: trackData.DURATION,
      MP3_320: trackData.FILESIZE_MP3_320,
      MP3_128: trackData.FILESIZE_MP3_128,
      TRACK_TOKEN: trackData.TRACK_TOKEN ? "present" : "missing",
    });

    // Verify this is the right track
    if (!verifyMatch(trackData, track)) {
      console.warn("[deezer] Track mismatch — deezer ISRC:", trackData.ISRC, "spotify ISRC:", track.isrc, "deezer duration:", trackData.DURATION, "spotify durationMs:", track.durationMs);
      return null;
    }

    // Pick best available format: prefer 320kbps MP3, then 128kbps
    let mediaFormat: "MP3_320" | "MP3_128" = "MP3_320";
    let cdnFormat: 1 | 3 | 9 = 3;
    let bitrate = 320;

    if (parseInt(trackData.FILESIZE_MP3_320) > 0) {
      mediaFormat = "MP3_320";
      cdnFormat = 3;
      bitrate = 320;
    } else if (parseInt(trackData.FILESIZE_MP3_128) > 0) {
      mediaFormat = "MP3_128";
      cdnFormat = 1;
      bitrate = 128;
    } else {
      console.log("[deezer] no MP3 format available");
      return null;
    }
    console.log("[deezer] using format:", mediaFormat, "bitrate:", bitrate);

    // Try media API first (returns direct streaming URL, better compatibility)
    let audioUrl: string | null = null;
    if (trackData.TRACK_TOKEN && licenseToken) {
      console.log("[deezer] trying media API...");
      audioUrl = await getMediaUrl(trackData.TRACK_TOKEN, mediaFormat, licenseToken);
      if (audioUrl) {
        console.log("[deezer] media API URL:", audioUrl.substring(0, 80) + "...");
      } else {
        console.log("[deezer] media API returned no URL");
      }
    }

    // Fall back to constructed CDN URL
    if (!audioUrl) {
      audioUrl = buildCdnUrl(
        trackData.MD5_ORIGIN,
        trackData.MEDIA_VERSION,
        trackData.SNG_ID,
        cdnFormat
      );
      console.log("[deezer] using CDN URL:", audioUrl.substring(0, 80) + "...");
    }

    const audioRes = await fetch(audioUrl, {
      signal: AbortSignal.timeout(30000),
    });
    if (!audioRes.ok) {
      console.log("[deezer] audio fetch failed:", audioRes.status);
      return null;
    }

    const encrypted = Buffer.from(await audioRes.arrayBuffer());
    console.log("[deezer] downloaded encrypted:", encrypted.length, "bytes");
    if (encrypted.length === 0) return null;

    const decrypted = decryptAudio(encrypted, trackData.SNG_ID);

    return { buffer: decrypted, format: "mp3", bitrate };
  } catch (e) {
    console.error("[deezer] Fetch failed:", e);
    return null;
  }
}
