import { NextResponse } from "next/server";
import { getTrending } from "@/lib/spotify";

export async function GET() {
  try {
    const songs = await getTrending(10);
    return NextResponse.json({ songs });
  } catch {
    return NextResponse.json({ songs: [] });
  }
}
