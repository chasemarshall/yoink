import type { TrackInfo } from "./spotify";
import { resolveSonglink } from "./songlink";
import { fetchDeezerAudio } from "./deezer";
import { searchYouTube, getAudioStreamUrl } from "./youtube";

export interface AudioResult {
  buffer: Buffer;
  source: "deezer" | "youtube";
  format: "mp3" | "flac" | "webm";
  bitrate: number;
}

async function tryDeezer(track: TrackInfo): Promise<AudioResult | null> {
  try {
    const links = await resolveSonglink(track.spotifyUrl);
    if (!links?.deezerId) return null;

    const result = await fetchDeezerAudio(links.deezerId, track);
    if (!result) return null;

    return {
      buffer: result.buffer,
      source: "deezer",
      format: result.format,
      bitrate: result.bitrate,
    };
  } catch {
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

export async function fetchBestAudio(track: TrackInfo): Promise<AudioResult> {
  // Try Deezer first (via Song.link)
  const deezerResult = await tryDeezer(track);
  if (deezerResult) return deezerResult;

  // Fall back to YouTube
  return tryYouTube(track);
}
