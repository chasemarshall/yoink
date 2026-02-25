import { NextRequest, NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";
import { searchItunesTrack } from "@/lib/itunes";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`search:${ip}`, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s`, rateLimit: true },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    try {
      const results = await searchTracks(q);
      return NextResponse.json({ results });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("rate limited")) {
        console.log("[search] Spotify rate limited, falling back to iTunes");
        const itunesResult = await searchItunesTrack("", q);
        if (itunesResult) {
          return NextResponse.json({ results: [itunesResult] });
        }
        return NextResponse.json({ error: "Search is temporarily limited — try again in a few minutes" }, { status: 503 });
      }
      throw e;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
