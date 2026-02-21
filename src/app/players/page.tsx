"use client";

import Link from "next/link";

interface Player {
  name: string;
  desc: string;
  url: string;
  flac: boolean;
  lyrics: boolean;
  free: boolean;
  note?: string;
}

const mac: Player[] = [
  {
    name: "foobar2000",
    desc: "the gold standard. lightweight, no bloat, bit-perfect playback. plugin ecosystem is smaller on mac but it reads embedded lyrics in the properties view.",
    url: "https://www.foobar2000.org/mac",
    flac: true,
    lyrics: false,
    free: true,
    note: "best for purists",
  },
  {
    name: "Swinsian",
    desc: "native mac player with full format support, embedded lyrics display in a sidebar, smart playlists, and a clean tag editor. the best mac experience if you'll pay for it.",
    url: "https://swinsian.com",
    flac: true,
    lyrics: true,
    free: false,
    note: "$25 one-time",
  },
  {
    name: "VLC",
    desc: "plays literally everything. not the prettiest music library but it handles every format you throw at it and it's completely free.",
    url: "https://www.videolan.org",
    flac: true,
    lyrics: false,
    free: true,
  },
  {
    name: "Doppler",
    desc: "beautiful, modern player built for mac. syncs to iOS. great for people who buy music from bandcamp or download with yoink.",
    url: "https://brushedtype.co/doppler/",
    flac: true,
    lyrics: false,
    free: false,
    note: "$25 one-time",
  },
];

const windows: Player[] = [
  {
    name: "foobar2000",
    desc: "the GOAT. endlessly customizable, bit-perfect output, massive plugin ecosystem. install OpenLyrics for synced lyrics display. this is what audiophiles use.",
    url: "https://www.foobar2000.org",
    flac: true,
    lyrics: true,
    free: true,
    note: "our top pick",
  },
  {
    name: "MusicBee",
    desc: "best all-rounder on windows. gorgeous interface, great library management, built-in lyrics panel, auto-tagging, and a 15-band EQ. genuinely impressive for free software.",
    url: "https://getmusicbee.com",
    flac: true,
    lyrics: true,
    free: true,
    note: "best for most people",
  },
  {
    name: "AIMP",
    desc: "lightweight russian-made player with one of the best audio engines available. supports every format imaginable, has a great EQ, and skins if you're into that.",
    url: "https://www.aimp.ru",
    flac: true,
    lyrics: true,
    free: true,
  },
  {
    name: "Winamp",
    desc: "the legend. it really does whip the llama's ass. back from the dead with modern codec support. nostalgia factor is off the charts.",
    url: "https://www.winamp.com",
    flac: true,
    lyrics: false,
    free: true,
    note: "classic",
  },
];

const ios: Player[] = [
  {
    name: "foobar2000",
    desc: "yes, it's on iOS too. plays FLAC files you transfer over, gapless playback, simple and clean interface.",
    url: "https://apps.apple.com/app/foobar2000/id1072807669",
    flac: true,
    lyrics: false,
    free: true,
  },
  {
    name: "Flacbox",
    desc: "built specifically for playing lossless files on iPhone. import via files, wifi transfer, or cloud storage. supports embedded lyrics.",
    url: "https://apps.apple.com/app/flacbox-hi-res-music-player/id1097564256",
    flac: true,
    lyrics: true,
    free: true,
    note: "best free option",
  },
  {
    name: "VOX",
    desc: "premium-feeling player with hi-res audio support, bass booster, and a 30-band EQ. the free tier plays local files, paid adds cloud locker.",
    url: "https://apps.apple.com/app/vox-mp3-flac-music-player/id916215494",
    flac: true,
    lyrics: false,
    free: true,
    note: "freemium",
  },
  {
    name: "Doppler",
    desc: "same team as the mac version. syncs between devices. beautiful design, native iOS feel, plays everything.",
    url: "https://apps.apple.com/app/doppler-mp3-flac-player/id1468459747",
    flac: true,
    lyrics: false,
    free: false,
    note: "$7",
  },
];

const android: Player[] = [
  {
    name: "Musicolet",
    desc: "completely free, no ads, fully offline. supports embedded lyrics, multiple queues, folder browsing, and a tag editor. the android GOAT.",
    url: "https://play.google.com/store/apps/details?id=in.krosbits.musicolet",
    flac: true,
    lyrics: true,
    free: true,
    note: "our top pick",
  },
  {
    name: "Poweramp",
    desc: "legendary audio engine with hi-res output, DSD support, gapless playback, and a 10-band EQ. shows embedded lyrics. worth the $5 after trial.",
    url: "https://play.google.com/store/apps/details?id=com.maxmpz.audioplayer",
    flac: true,
    lyrics: true,
    free: false,
    note: "$5 after 15-day trial",
  },
  {
    name: "AIMP",
    desc: "same great audio engine as the windows version. lightweight, great EQ, theme support, and plays everything.",
    url: "https://play.google.com/store/apps/details?id=com.aimp.player",
    flac: true,
    lyrics: true,
    free: true,
  },
  {
    name: "BlackPlayer",
    desc: "clean material design, customizable UI, built-in EQ, gapless playback, and a tag editor for embedded lyrics. free version has ads.",
    url: "https://play.google.com/store/apps/details?id=com.musicplayer.blackplayerfree",
    flac: true,
    lyrics: true,
    free: true,
    note: "ad-supported",
  },
];

function PlatformSection({
  platform,
  icon,
  players,
  delay,
}: {
  platform: string;
  icon: string;
  players: Player[];
  delay: number;
}) {
  return (
    <section className="px-6 py-24 max-w-2xl mx-auto">
      <div className="space-y-10">
        <p
          className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
          style={{ opacity: 0, animationDelay: `${delay}ms` }}
        >
          <span className="mr-2">{icon}</span>
          {platform}
        </p>
        <div className="space-y-4">
          {players.map((p, i) => (
            <a
              key={p.name + platform}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-fade-in-up group block border border-surface0/60 rounded-lg p-5 bg-mantle/40 hover:bg-surface0/20 hover:border-surface1/60 transition-all duration-300"
              style={{ opacity: 0, animationDelay: `${delay + (i + 1) * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-text group-hover:text-lavender transition-colors duration-200">
                      {p.name}
                    </span>
                    {p.note && (
                      <span className="text-[9px] uppercase tracking-widest font-bold text-mauve/60 border border-mauve/20 px-2 py-0.5 rounded-full">
                        {p.note}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-overlay1 leading-relaxed">
                    {p.desc}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    {p.flac && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-green/60">
                        flac
                      </span>
                    )}
                    {p.lyrics && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-peach/60">
                        lyrics
                      </span>
                    )}
                    {p.free && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-lavender/60">
                        free
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-overlay0/40 group-hover:text-lavender/60 transition-colors duration-200 text-xs mt-1 flex-shrink-0">
                  ↗
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-grid">
      {/* Nav */}
      <nav className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="status-dot w-2 h-2 rounded-full bg-green" />
          <span className="text-sm font-bold tracking-wider uppercase text-text group-hover:text-lavender transition-colors">
            yoink
          </span>
        </Link>
        <Link
          href="/app"
          className="btn-press text-xs text-crust bg-lavender hover:bg-mauve px-4 py-2 rounded-md font-bold uppercase tracking-wider transition-colors duration-200"
        >
          open app
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-32 pb-24 max-w-2xl mx-auto">
        <div className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="text-xs text-lavender uppercase tracking-[0.3em] font-bold">
            recommended players
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            play your
            <br />
            <span className="text-lavender">downloads.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            yoink gives you the files. these players make them sound great —
            with flac support, embedded lyrics, and no subscriptions.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Tip */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-surface0/60 rounded-lg p-5 bg-mantle/40 space-y-3"
          style={{ opacity: 0 }}
        >
          <p className="text-sm font-bold text-text">
            your files already have lyrics
          </p>
          <p className="text-sm text-overlay1 leading-relaxed">
            yoink embeds lyrics directly into the file metadata. any player
            marked with{" "}
            <span className="text-[9px] uppercase tracking-wider font-bold text-peach/60">
              lyrics
            </span>{" "}
            below will display them automatically — no plugins, no setup.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      <PlatformSection platform="windows" icon="⊞" players={windows} delay={0} />

      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      <PlatformSection platform="mac" icon="⌘" players={mac} delay={0} />

      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      <PlatformSection platform="ios" icon="◉" players={ios} delay={0} />

      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      <PlatformSection platform="android" icon="▲" players={android} delay={0} />

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* CTA */}
      <section className="px-6 py-24 pb-32 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-surface0/60 rounded-lg p-8 bg-mantle/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{ opacity: 0 }}
        >
          <div className="space-y-1">
            <p className="text-base font-bold text-text">need files first?</p>
            <p className="text-sm text-overlay0">
              grab some tracks, then come back here.
            </p>
          </div>
          <Link
            href="/app"
            className="btn-press text-sm text-crust bg-lavender hover:bg-mauve px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors duration-200 flex-shrink-0"
          >
            open yoink
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>yoink</span>
        <div className="flex items-center gap-4">
          <a
            href="https://chasefrazier.dev/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-peach transition-colors duration-200"
          >
            tip jar
          </a>
          <span>metadata included</span>
        </div>
      </footer>
    </div>
  );
}
