import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo, getPlaylistInfo, detectUrlType, detectPlatform, extractYouTubeId } from "@/lib/spotify";
import { getYouTubeTrackInfo } from "@/lib/youtube";
import { resolveToSpotify } from "@/lib/songlink";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`meta:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const platform = detectPlatform(url);

    if (!platform) {
      return NextResponse.json(
        { error: "paste a spotify, apple music, or youtube link" },
        { status: 400 }
      );
    }

    // Apple Music → resolve to Spotify via Song.link
    if (platform === "apple-music") {
      const resolved = await resolveToSpotify(url);
      if (!resolved?.spotifyUrl) {
        return NextResponse.json(
          { error: "couldn't find this track on spotify — try pasting the spotify link directly" },
          { status: 404 }
        );
      }

      const urlType = detectUrlType(resolved.spotifyUrl);
      if (urlType === "playlist") {
        const playlist = await getPlaylistInfo(resolved.spotifyUrl);
        return NextResponse.json({ type: "playlist", ...playlist });
      }
      const track = await getTrackInfo(resolved.spotifyUrl);
      return NextResponse.json({ type: "track", ...track });
    }

    // YouTube → get info from Piped, try to find Spotify match for metadata
    if (platform === "youtube") {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return NextResponse.json({ error: "invalid youtube link" }, { status: 400 });
      }

      const ytInfo = await getYouTubeTrackInfo(videoId);

      // Try to find a Spotify match via Song.link for better metadata
      const resolved = await resolveToSpotify(url);
      if (resolved?.spotifyUrl) {
        try {
          const spotifyTrack = await getTrackInfo(resolved.spotifyUrl);
          return NextResponse.json({
            type: "track",
            ...spotifyTrack,
            _youtubeId: videoId,
            _originalPlatform: "youtube",
          });
        } catch {
          // Spotify lookup failed, use YouTube metadata
        }
      }

      return NextResponse.json({
        type: "track",
        ...ytInfo,
        spotifyUrl: "", // No Spotify match
        _youtubeId: videoId,
        _originalPlatform: "youtube",
      });
    }

    // Spotify — existing flow
    const urlType = detectUrlType(url);

    if (!urlType) {
      return NextResponse.json(
        { error: "paste a track or playlist link — artist and album pages aren't supported yet" },
        { status: 400 }
      );
    }

    if (urlType === "playlist") {
      const playlist = await getPlaylistInfo(url);
      return NextResponse.json({ type: "playlist", ...playlist });
    }

    const track = await getTrackInfo(url);
    return NextResponse.json({ type: "track", ...track });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
