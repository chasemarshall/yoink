import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json({ error: "Please provide a valid Spotify track URL" }, { status: 400 });
    }

    const track = await getTrackInfo(url);
    return NextResponse.json(track);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch track info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
