import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo, getPlaylistInfo, getAlbumInfo, getArtistTopTracks, detectUrlType, detectPlatform, extractYouTubeId, isSpotifyRateLimited, type TrackInfo } from "@/lib/spotify";
import { getDeezerTrackBySpotifyUrl, getDeezerAlbumBySpotifyUrl } from "@/lib/deezer-metadata";
import { getYouTubeTrackInfo } from "@/lib/youtube";
import { resolveToSpotify } from "@/lib/songlink";
import { lookupTidalVideoCover } from "@/lib/tidal";
import { rateLimit } from "@/lib/ratelimit";
import { metadataCache } from "@/lib/cache";
import { getAppleMusicTrackBySpotifyUrl, getAppleMusicAlbumBySpotifyUrl } from "@/lib/itunes";

async function enrichWithVideoCover(track: TrackInfo): Promise<TrackInfo> {
  try {
    const videoCover = await lookupTidalVideoCover(track);
    if (videoCover) track.videoCover = videoCover;
  } catch {
    // Never block metadata response
  }
  return track;
}

// Waterfall: Deezer public (has ISRC, better for audio matching) → Apple Music
async function getTrackFallbacks(url: string): Promise<TrackInfo | null> {
  console.log("[metadata] trying deezer public fallback");
  const deezerTrack = await getDeezerTrackBySpotifyUrl(url);
  if (deezerTrack) return deezerTrack;

  console.log("[metadata] trying apple music fallback");
  const amTrack = await getAppleMusicTrackBySpotifyUrl(url);
  if (amTrack) return amTrack;

  return null;
}

// Spotify first, then fallback waterfall
async function getTrackWithFallback(url: string): Promise<TrackInfo> {
  if (isSpotifyRateLimited()) {
    const track = await getTrackFallbacks(url);
    if (track) return track;
    throw new Error("metadata temporarily unavailable — try again shortly");
  }

  try {
    return await getTrackInfo(url);
  } catch (e) {
    if (e instanceof Error && e.message.includes("rate limited")) {
      const track = await getTrackFallbacks(url);
      if (track) return track;
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

    // Check cache before doing any API work
    const cached = metadataCache.get(url);
    if (cached) {
      console.log("[metadata] cache hit:", url);
      return NextResponse.json(cached);
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
          const result = { type: "playlist", ...playlist };
          metadataCache.set(url, result);
          return NextResponse.json(result);
        } catch {
          return NextResponse.json({ error: "couldn't fetch playlist info — try again shortly" }, { status: 500 });
        }
      }
      const track = await enrichWithVideoCover(await getTrackWithFallback(resolved.spotifyUrl));
      const result = { type: "track", ...track };
      metadataCache.set(url, result);
      return NextResponse.json(result);
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
          const result = {
            type: "track",
            ...spotifyTrack,
            _youtubeId: videoId,
            _originalPlatform: "youtube",
          };
          metadataCache.set(url, result);
          return NextResponse.json(result);
        } catch {
          // Spotify lookup failed, use YouTube metadata
        }
      }

      const enrichedYt = await enrichWithVideoCover(ytInfo as TrackInfo);
      const result = {
        type: "track",
        ...enrichedYt,
        spotifyUrl: "", // No Spotify match
        _youtubeId: videoId,
        _originalPlatform: "youtube",
      };
      metadataCache.set(url, result);
      return NextResponse.json(result);
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
        const result = { type: "playlist", ...playlist };
        metadataCache.set(url, result);
        return NextResponse.json(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Playlist fetch failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    if (urlType === "album") {
      // Waterfall: Spotify → song.link+Deezer → Apple Music → Deezer text search
      const tryAlbumFallbacks = async () => {
        const deezerAlbum = await getDeezerAlbumBySpotifyUrl(url); // song.link→Deezer first
        if (deezerAlbum) return deezerAlbum;
        console.log("[metadata] trying apple music album fallback");
        const amAlbum = await getAppleMusicAlbumBySpotifyUrl(url);
        if (amAlbum) return amAlbum;
        return null;
      };

      if (isSpotifyRateLimited()) {
        const album = await tryAlbumFallbacks();
        if (album) {
          const result = { type: "playlist", ...album };
          metadataCache.set(url, result);
          return NextResponse.json(result);
        }
        return NextResponse.json({ error: "metadata temporarily unavailable — try again shortly" }, { status: 503 });
      }

      try {
        const album = await getAlbumInfo(url);
        const result = { type: "playlist", ...album };
        metadataCache.set(url, result);
        return NextResponse.json(result);
      } catch (e) {
        if (e instanceof Error && e.message.includes("rate limited")) {
          const album = await tryAlbumFallbacks();
          if (album) {
            const result = { type: "playlist", ...album };
            metadataCache.set(url, result);
            return NextResponse.json(result);
          }
        }
        throw e;
      }
    }

    if (urlType === "artist") {
      // Artist top tracks — no good Deezer fallback
      const artist = await getArtistTopTracks(url);
      const result = { type: "playlist", ...artist };
      metadataCache.set(url, result);
      return NextResponse.json(result);
    }

    const track = await enrichWithVideoCover(await getTrackWithFallback(url));
    const result = { type: "track", ...track };
    metadataCache.set(url, result);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
