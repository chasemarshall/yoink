import type { TrackInfo } from "./spotify";
import { resolveSonglink } from "./songlink";
import { fetchDeezerAudio, lookupDeezerByIsrc } from "./deezer";
import { lookupTidalByIsrc, fetchTidalAudio } from "./tidal";
import { searchYouTube, getAudioStreamUrl } from "./youtube";
import { analyzeAudio, type AudioQualityInfo } from "./ffprobe";
import { verifyTrack, type AcoustIdResult } from "./acoustid";

export interface AudioResult {
  buffer: Buffer;
  source: "deezer" | "tidal" | "youtube";
  format: "mp3" | "flac" | "webm";
  bitrate: number;
  qualityInfo?: AudioQualityInfo;
  verification?: AcoustIdResult;
}

async function getDeezerIdForTrack(track: TrackInfo): Promise<string | null> {
  // Fast path: ISRC lookup via Deezer public API (no rate limit)
  if (track.isrc) {
    console.log("[audio] looking up deezer by ISRC:", track.isrc);
    const id = await lookupDeezerByIsrc(track.isrc);
    if (id) return id;
    console.log("[audio] ISRC lookup returned nothing");
  }

  // Slow path: Song.link (rate limited, used as fallback)
  const links = await resolveSonglink(track.spotifyUrl);
  return links?.deezerId || null;
}

async function tryDeezer(track: TrackInfo, preferFlac: boolean): Promise<AudioResult | null> {
  try {
    console.log("[audio] trying deezer for:", track.name, preferFlac ? "(flac)" : "(mp3)");
    const deezerId = await getDeezerIdForTrack(track);
    if (!deezerId) {
      console.log("[audio] no deezer id found");
      return null;
    }

    console.log("[audio] got deezer id:", deezerId);
    const result = await fetchDeezerAudio(deezerId, track, preferFlac);
    if (!result) {
      console.log("[audio] deezer fetch returned null");
      return null;
    }

    console.log("[audio] deezer success:", result.format, result.bitrate === 0 ? "lossless" : result.bitrate + "kbps");
    return {
      buffer: result.buffer,
      source: "deezer",
      format: result.format,
      bitrate: result.bitrate,
    };
  } catch (e) {
    console.error("[audio] deezer error:", e);
    return null;
  }
}

async function getTidalIdForTrack(track: TrackInfo): Promise<string | null> {
  // Fast path: ISRC lookup via Tidal API
  if (track.isrc) {
    console.log("[audio] looking up tidal by ISRC:", track.isrc);
    const id = await lookupTidalByIsrc(track.isrc);
    if (id) return id;
    console.log("[audio] Tidal ISRC lookup returned nothing");
  }

  // Slow path: Song.link fallback
  const links = await resolveSonglink(track.spotifyUrl);
  return links?.tidalId || null;
}

async function tryTidal(track: TrackInfo, preferHiRes: boolean): Promise<AudioResult | null> {
  try {
    console.log("[audio] trying tidal for:", track.name, preferHiRes ? "(hi-res)" : "(lossless)");
    const tidalId = await getTidalIdForTrack(track);
    if (!tidalId) {
      console.log("[audio] no tidal id found");
      return null;
    }

    console.log("[audio] got tidal id:", tidalId);
    const result = await fetchTidalAudio(tidalId, track, preferHiRes);
    if (!result) {
      console.log("[audio] tidal fetch returned null");
      return null;
    }

    console.log("[audio] tidal success:", result.format, result.bitrate === 0 ? "lossless" : result.bitrate + "kbps", `(${result.quality})`);
    return {
      buffer: result.buffer,
      source: "tidal",
      format: result.format,
      bitrate: result.bitrate,
    };
  } catch (e) {
    console.error("[audio] tidal error:", e);
    return null;
  }
}

async function tryYouTube(track: TrackInfo): Promise<AudioResult> {
  const query = `${track.artist} - ${track.name}`;
  const videoId = await searchYouTube(query, {
    artist: track.artist,
    title: track.name,
    durationMs: track.durationMs,
  });
  if (!videoId) {
    throw new Error("Could not find this track on YouTube");
  }

  const audioUrl = await getAudioStreamUrl(videoId);

  const ALLOWED_AUDIO_HOSTS = [
    "googlevideo.com",
    "youtube.com",
    "pipedproxy.kavin.rocks",
    "pipedproxy.adminforge.de",
    "withmilo.xyz",
  ];

  try {
    const parsed = new URL(audioUrl);
    const allowed = ALLOWED_AUDIO_HOSTS.some((host) =>
      parsed.hostname.endsWith(host)
    );
    if (!allowed) throw new Error("Audio source URL is not from an allowed host");
  } catch (e) {
    if (e instanceof Error && e.message.includes("allowed host")) throw e;
    throw new Error("Invalid audio source URL");
  }

  const audioRes = await fetch(audioUrl, {
    signal: AbortSignal.timeout(60000),
  });

  if (!audioRes.ok) {
    throw new Error(`Audio download failed: ${audioRes.status}`);
  }

  const buffer = Buffer.from(await audioRes.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Downloaded audio is empty");
  }

  return {
    buffer,
    source: "youtube",
    format: "webm",
    bitrate: 160,
  };
}

export async function fetchBestAudio(track: TrackInfo, preferFlac = false): Promise<AudioResult> {
  // Try Tidal first (hi-res capable, best quality)
  const tidalResult = await tryTidal(track, preferFlac);
  if (tidalResult) {
    try {
      tidalResult.qualityInfo = await analyzeAudio(tidalResult.buffer, tidalResult.format) ?? undefined;
    } catch {
      // never block download
    }
    return tidalResult;
  }

  // Try Deezer second (CD lossless, no subscription cost)
  const deezerResult = await tryDeezer(track, preferFlac);
  if (deezerResult) {
    try {
      deezerResult.qualityInfo = await analyzeAudio(deezerResult.buffer, deezerResult.format) ?? undefined;
    } catch {
      // never block download
    }
    return deezerResult;
  }

  // Fall back to YouTube (always WebM/Opus, no FLAC available)
  const ytResult = await tryYouTube(track);

  // Quality scan + AcoustID verification for YouTube audio (non-blocking)
  try {
    const [quality, verification] = await Promise.all([
      analyzeAudio(ytResult.buffer, ytResult.format).catch(() => null),
      verifyTrack(ytResult.buffer, ytResult.format, track).catch(() => ({ verified: false, confidence: 0 })),
    ]);
    ytResult.qualityInfo = quality ?? undefined;
    ytResult.verification = verification;
  } catch {
    // never block download
  }

  return ytResult;
}
