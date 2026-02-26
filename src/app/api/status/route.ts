import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { isSpotifyRateLimited } from "@/lib/spotify";

const execFileAsync = promisify(execFile);

async function check(
  name: string,
  fn: () => Promise<boolean>
): Promise<{ name: string; ok: boolean }> {
  try {
    return { name, ok: await fn() };
  } catch {
    return { name, ok: false };
  }
}

export async function GET() {
  const start = Date.now();

  const checks = await Promise.all([
    check("spotify", async () => {
      const id = process.env.SPOTIFY_CLIENT_ID;
      const secret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!id || !secret) return false;
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    }),

    check("ffmpeg", async () => {
      const { stdout } = await execFileAsync("ffmpeg", ["-version"], {
        timeout: 3000,
      });
      return stdout.includes("ffmpeg version");
    }),

    check("lrclib", async () => {
      const proxy = process.env.LRCLIB_PROXY_URL;
      const url = proxy
        ? `${proxy}/api/get?artist_name=test&track_name=test`
        : "https://lrclib.net/api/get?artist_name=test&track_name=test";
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      return res.status === 200 || res.status === 404;
    }),

    check("itunes", async () => {
      const res = await fetch(
        "https://itunes.apple.com/search?term=test&limit=1",
        { signal: AbortSignal.timeout(5000) }
      );
      return res.ok;
    }),
  ]);

  const spotifyRateLimited = isSpotifyRateLimited();

  const audioSources = {
    deezer: !!process.env.DEEZER_ARL,
    tidal: !!process.env.TIDAL_ACCESS_TOKEN,
    youtube: !!(process.env.PIPED_API_URL || true), // always available via default instance
  };

  // spotify can be "reachable" but rate limited — reflect that honestly
  const spotifyCheck = checks.find((c) => c.name === "spotify");
  if (spotifyCheck && spotifyRateLimited) {
    spotifyCheck.ok = false;
  }

  const allOk = checks.every((c) => c.ok);

  return NextResponse.json({
    status: allOk ? "operational" : "degraded",
    checks,
    audioSources,
    spotifyRateLimited,
    latency: Date.now() - start,
    timestamp: new Date().toISOString(),
  });
}
