import { NextRequest, NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = rateLimit(`search:${ip}`, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `slow down — try again in ${retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const results = await searchTracks(q);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
