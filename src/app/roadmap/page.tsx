"use client";

import Link from "next/link";

type Status = "shipped" | "in-progress" | "planned";

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
  tag?: string;
}

const items: RoadmapItem[] = [
  {
    title: "single track downloads",
    description: "paste a spotify link, get an mp3 with full id3 metadata — title, artist, album, cover art, genre, release date.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "playlist downloads",
    description: "paste a playlist link, preview all tracks, download everything as a zip. streaming progress for each track.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "lossless formats",
    description: "flac and alac output with proper metadata embedding. choose your format before you download.",
    status: "shipped",
    tag: "audio",
  },
  {
    title: "lyrics embedding",
    description: "synced and unsynced lyrics fetched automatically and written into every file's metadata.",
    status: "shipped",
    tag: "metadata",
  },
  {
    title: "album downloads",
    description: "paste an album link — all tracks fetched, previewed, and zipped just like playlists.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "artist top tracks",
    description: "paste an artist link to grab their top 10 tracks as a zip with full metadata.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "explicit tags",
    description: "itunes advisory metadata embedded directly into m4a files. apple music shows the E badge on import.",
    status: "shipped",
    tag: "metadata",
  },
  {
    title: "apple music & youtube links",
    description: "paste an apple music or youtube link — we resolve it to spotify for metadata, then download.",
    status: "shipped",
    tag: "platforms",
  },
  {
    title: "search by song name",
    description: "type a song name instead of pasting a link — search results with preview and one-click download.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "track number metadata",
    description: "track numbers, disc numbers, and total tracks embedded so files sort correctly in any player.",
    status: "shipped",
    tag: "metadata",
  },
  {
    title: "apple music catalog matching",
    description: "ISRC codes, album artist, and itunes catalog ids (cnID/plID/atID/geID) embedded into m4a files. apple music recognizes your files as catalog matches — no dashed clouds, proper syncing.",
    status: "shipped",
    tag: "metadata",
  },
  {
    title: "multi-source audio",
    description: "waterfall audio pipeline — deezer, tidal, and youtube as sources. automatic fallback if one fails. lossless from deezer and tidal.",
    status: "shipped",
    tag: "audio",
  },
  {
    title: "docker self-hosting",
    description: "dockerfile and docker-compose for running yoink on your own hardware. full control, no rate limits.",
    status: "shipped",
    tag: "core",
  },
  {
    title: "musixmatch lyrics",
    description: "musixmatch as a fallback lyrics source when lrclib misses. better coverage for synced and plain lyrics.",
    status: "in-progress",
    tag: "metadata",
  },
  {
    title: "open source",
    description: "opening up the full yoink codebase. contribute features, run your own instance, or just read the code.",
    status: "planned",
    tag: "core",
  },
  {
    title: "additional link resolvers",
    description: "odesli and isrc-based fallbacks for cross-platform link resolution when direct matching fails.",
    status: "planned",
    tag: "platforms",
  },
  {
    title: "qobuz audio source",
    description: "qobuz as an additional hi-res lossless audio source alongside the existing pipeline.",
    status: "planned",
    tag: "audio",
  },
  {
    title: "queue system",
    description: "download multiple links back to back without waiting for each one to finish.",
    status: "planned",
    tag: "ux",
  },
  {
    title: "mobile experience",
    description: "optimized layout and download flow for phones. maybe a pwa.",
    status: "planned",
    tag: "ux",
  },
  {
    title: "podcast support",
    description: "paste a spotify podcast episode link and download it as an mp3.",
    status: "planned",
    tag: "platforms",
  },
  {
    title: "yoink pro",
    description: "maybe one day — an optional paid tier with higher rate limits and larger playlist caps. nothing concrete yet. free tier stays free forever.",
    status: "planned",
    tag: "core",
  },
];

const statusConfig: Record<Status, { label: string; color: string; dotColor: string; bgColor: string }> = {
  shipped: {
    label: "shipped",
    color: "text-green",
    dotColor: "bg-green",
    bgColor: "bg-green/10",
  },
  "in-progress": {
    label: "building",
    color: "text-lavender",
    dotColor: "bg-lavender",
    bgColor: "bg-lavender/10",
  },
  planned: {
    label: "planned",
    color: "text-overlay1",
    dotColor: "bg-surface2",
    bgColor: "bg-surface0/20",
  },
};

const tagColors: Record<string, string> = {
  core: "text-lavender/70 border-lavender/20",
  audio: "text-peach/70 border-peach/20",
  metadata: "text-green/70 border-green/20",
  platforms: "text-mauve/70 border-mauve/20",
  ux: "text-subtext0/70 border-subtext0/20",
};

export default function RoadmapPage() {
  const shipped = items.filter((i) => i.status === "shipped");
  const inProgress = items.filter((i) => i.status === "in-progress");
  const planned = items.filter((i) => i.status === "planned");

  const sections: { status: Status; items: RoadmapItem[] }[] = [
    ...(shipped.length ? [{ status: "shipped" as Status, items: shipped }] : []),
    ...(inProgress.length ? [{ status: "in-progress" as Status, items: inProgress }] : []),
    ...(planned.length ? [{ status: "planned" as Status, items: planned }] : []),
  ];

  return (
    <div className="min-h-screen bg-grid">
      {/* Nav */}
      <nav className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/status" className="status-dot w-2 h-2 rounded-full bg-green hover:shadow-[0_0_8px_rgba(166,227,161,0.6)] transition-shadow" />
          <Link href="/" className="text-sm font-bold tracking-wider uppercase text-text hover:text-lavender transition-colors">
            yoink
          </Link>
        </div>
        <Link
          href="/app"
          className="btn-press text-xs text-crust bg-lavender hover:bg-mauve px-4 py-2 rounded-md font-bold uppercase tracking-wider transition-colors duration-200"
        >
          open app
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 max-w-2xl mx-auto">
        <div className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="text-xs text-lavender uppercase tracking-[0.3em] font-bold">
            roadmap
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            what&apos;s next
            <br />
            <span className="text-lavender">for yoink.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            everything we&apos;ve shipped, what we&apos;re building, and
            where we&apos;re headed.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Stats bar */}
      <section className="px-6 py-12 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up flex items-center gap-3 sm:gap-8 flex-wrap"
          style={{ opacity: 0, animationDelay: "80ms" }}
        >
          {sections.map((s) => {
            const cfg = statusConfig[s.status];
            return (
              <div key={s.status} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-surface2">{s.items.length}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      {sections.map((section, sectionIdx) => {
        const cfg = statusConfig[section.status];
        return (
          <div key={section.status}>
            {/* Divider */}
            <div className="max-w-2xl mx-auto px-6">
              <div className="border-t border-surface0/40" />
            </div>

            <section className="px-6 py-16 max-w-2xl mx-auto">
              <div className="space-y-10">
                {/* Section header */}
                <div
                  className="animate-fade-in-up flex items-center gap-3"
                  style={{ opacity: 0 }}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                  <p className={`text-xs uppercase tracking-[0.3em] font-bold ${cfg.color}`}>
                    {cfg.label}
                  </p>
                </div>

                {/* Items */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[4px] top-0 bottom-0 w-px bg-surface0/40" />

                  <div className="space-y-1">
                    {section.items.map((item, i) => (
                      <div
                        key={item.title}
                        className="animate-fade-in-up relative pl-8 py-4 group"
                        style={{
                          opacity: 0,
                          animationDelay: `${(sectionIdx * 100) + (i * 60)}ms`,
                        }}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-[22px] w-[9px] h-[9px] rounded-full border-2 border-base ${cfg.dotColor} transition-transform duration-200 group-hover:scale-125`}
                        />

                        <div className="space-y-2">
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
                            <p className="text-sm font-bold text-text">
                              {item.title}
                            </p>
                            {item.tag && (
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  tagColors[item.tag] || "text-overlay0/70 border-overlay0/20"
                                }`}
                              >
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-subtext0/80 leading-relaxed max-w-lg">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      })}

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* CTA */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-surface0/60 rounded-lg p-6 sm:p-8 bg-mantle/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6"
          style={{ opacity: 0 }}
        >
          <div className="space-y-1">
            <p className="text-base font-bold text-text">want something on here?</p>
            <p className="text-sm text-overlay0">
              reach out and tell us what to build next.
            </p>
          </div>
          <a
            href="mailto:me@yoinkify.lol"
            className="btn-press text-sm text-lavender border border-lavender/30 hover:bg-lavender/10 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 flex-shrink-0"
          >
            me@yoinkify.lol
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>yoink</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/how" className="text-mauve/60 hover:text-mauve transition-colors duration-200">local files</Link>
          <Link href="/players" className="text-green/60 hover:text-green transition-colors duration-200">players</Link>
          <a
            href="https://chasefrazier.dev/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-peach transition-colors duration-200"
          >
            tip jar
          </a>
        </div>
      </footer>
    </div>
  );
}
