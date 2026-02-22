const MUSIXMATCH_TOKEN = process.env.MUSIXMATCH_TOKEN;

export async function fetchMusixmatchLyrics(
  artist: string,
  title: string
): Promise<string | null> {
  if (!MUSIXMATCH_TOKEN) return null;

  try {
    const params = new URLSearchParams({
      format: "json",
      namespace: "lyrics_richsynched",
      subtitle_format: "mxm",
      app_id: "web-desktop-app-v1.0",
      usertoken: MUSIXMATCH_TOKEN,
      q_artist: artist,
      q_track: title,
    });

    const res = await fetch(
      `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?${params}`,
      {
        headers: { cookie: "x-mxm-token-guid=" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const macroCalls = data?.message?.body?.macro_calls;
    if (!macroCalls) return null;

    // Try synced subtitles first
    const subtitles =
      macroCalls["track.subtitles.get"]?.message?.body?.subtitle_list;
    if (subtitles?.length) {
      const raw = subtitles[0]?.subtitle?.subtitle_body;
      if (raw) return raw;
    }

    // Fall back to plain lyrics
    const lyrics =
      macroCalls["track.lyrics.get"]?.message?.body?.lyrics?.lyrics_body;
    if (lyrics) return lyrics;

    return null;
  } catch {
    return null;
  }
}
