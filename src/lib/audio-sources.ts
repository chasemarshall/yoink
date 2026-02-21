import type { TrackInfo } from "./spotify";
import { resolveSonglink } from "./songlink";
import { fetchDeezerAudio, lookupDeezerByIsrc } from "./deezer";
import { searchYouTube, getAudioStreamUrl } from "./youtube";

export interface AudioResult {
  buffer: Buffer;
  source: "deezer" | "youtube";
  format: "mp3" | "flac" | "webm";
  bitrate: number;
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

async function tryYouTube(track: TrackInfo): Promise<AudioResult> {
  const query = `${track.artist} - ${track.name}`;
  const videoId = await searchYouTube(query);
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
  // Try Deezer first (ISRC lookup, no rate limit)
  const deezerResult = await tryDeezer(track, preferFlac);
  if (deezerResult) return deezerResult;

  // Fall back to YouTube (always WebM/Opus, no FLAC available)
  return tryYouTube(track);
}
