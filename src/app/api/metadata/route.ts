import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo, getPlaylistInfo, getAlbumInfo, getArtistTopTracks, detectUrlType, detectPlatform, extractYouTubeId, isSpotifyRateLimited, type TrackInfo } from "@/lib/spotify";
import { getDeezerTrackBySpotifyUrl, getDeezerAlbumBySpotifyUrl } from "@/lib/deezer-metadata";
import { getYouTubeTrackInfo } from "@/lib/youtube";
import { resolveToSpotify } from "@/lib/songlink";
import { lookupTidalVideoCover } from "@/lib/tidal";
import { rateLimit } from "@/lib/ratelimit";

async function enrichWithVideoCover(track: TrackInfo): Promise<TrackInfo> {
  try {
    const videoCover = await lookupTidalVideoCover(track);
    if (videoCover) track.videoCover = videoCover;
  } catch {
    // Never block metadata response
  }
  return track;
}

// Try Spotify first, fall back to Deezer if rate limited
async function getTrackWithFallback(url: string): Promise<TrackInfo> {
  // If we know Spotify is rate limited, go straight to Deezer
  if (isSpotifyRateLimited()) {
    console.log("[metadata] spotify rate limited, trying deezer fallback");
    const deezerTrack = await getDeezerTrackBySpotifyUrl(url);
    if (deezerTrack) return deezerTrack;
    // If Deezer also fails, throw so the user sees the rate limit message
    throw new Error("Spotify is rate limited and Deezer fallback failed — try again shortly");
  }

  try {
    return await getTrackInfo(url);
  } catch (e) {
    // If it was a rate limit error, try Deezer
    if (e instanceof Error && e.message.includes("rate limited")) {
      console.log("[metadata] spotify rate limited mid-request, trying deezer fallback");
      const deezerTrack = await getDeezerTrackBySpotifyUrl(url);
      if (deezerTrack) return deezerTrack;
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`meta:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s`, rateLimit: true },
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
          { error: "this track isn't available outside apple music — apple music exclusives can't be downloaded yet" },
          { status: 404 }
        );
      }

      const urlType = detectUrlType(resolved.spotifyUrl);
      if (urlType === "playlist") {
        try {
          const playlist = await getPlaylistInfo(resolved.spotifyUrl);
          return NextResponse.json({ type: "playlist", ...playlist });
        } catch {
          return NextResponse.json({ error: "couldn't fetch playlist info — try again shortly" }, { status: 500 });
        }
      }
      const track = await enrichWithVideoCover(await getTrackWithFallback(resolved.spotifyUrl));
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
          const spotifyTrack = await enrichWithVideoCover(await getTrackWithFallback(resolved.spotifyUrl));
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

      const enrichedYt = await enrichWithVideoCover(ytInfo as TrackInfo);
      return NextResponse.json({
        type: "track",
        ...enrichedYt,
        spotifyUrl: "", // No Spotify match
        _youtubeId: videoId,
        _originalPlatform: "youtube",
      });
    }

    // Spotify — try Spotify first, fall back to Deezer when rate limited
    const urlType = detectUrlType(url);

    if (!urlType) {
      return NextResponse.json(
        { error: "paste a track, playlist, album, or artist link" },
        { status: 400 }
      );
    }

    if (urlType === "playlist") {
      // Playlists can't easily fall back to Deezer — different IDs
      try {
        const playlist = await getPlaylistInfo(url);
        return NextResponse.json({ type: "playlist", ...playlist });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Playlist fetch failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    if (urlType === "album") {
      // Try Spotify, fall back to Deezer
      if (isSpotifyRateLimited()) {
        console.log("[metadata] spotify rate limited, trying deezer album fallback");
        const deezerAlbum = await getDeezerAlbumBySpotifyUrl(url);
        if (deezerAlbum) {
          return NextResponse.json({ type: "playlist", ...deezerAlbum });
        }
      }

      try {
        const album = await getAlbumInfo(url);
        return NextResponse.json({ type: "playlist", ...album });
      } catch (e) {
        if (e instanceof Error && e.message.includes("rate limited")) {
          console.log("[metadata] spotify rate limited mid-request, trying deezer album fallback");
          const deezerAlbum = await getDeezerAlbumBySpotifyUrl(url);
          if (deezerAlbum) {
            return NextResponse.json({ type: "playlist", ...deezerAlbum });
          }
        }
        throw e;
      }
    }

    if (urlType === "artist") {
      // Artist top tracks — no good Deezer fallback
      const artist = await getArtistTopTracks(url);
      return NextResponse.json({ type: "playlist", ...artist });
    }

    const track = await enrichWithVideoCover(await getTrackWithFallback(url));
    return NextResponse.json({ type: "track", ...track });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
