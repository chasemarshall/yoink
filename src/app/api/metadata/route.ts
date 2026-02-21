import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo, getPlaylistInfo, detectUrlType } from "@/lib/spotify";
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
