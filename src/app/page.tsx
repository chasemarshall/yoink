"use client";

import Link from "next/link";

const features = [
  {
    label: "tracks",
    desc: "paste a spotify track link. get the mp3 with full id3 metadata — title, artist, album, cover art. 320kbps.",
  },
  {
    label: "playlists",
    desc: "paste a playlist link. see every track. download them all sequentially with per-track progress.",
  },
  {
    label: "metadata",
    desc: "embedded id3v2 tags and album art. your music library will thank you.",
  },
];

const steps = [
  { num: "01", text: "paste a spotify link" },
  { num: "02", text: "we fetch the metadata" },
  { num: "03", text: "find the audio on youtube" },
  { num: "04", text: "convert, tag, deliver" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-grid">
      {/* Nav */}
      <nav className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="status-dot w-2 h-2 rounded-full bg-green" />
          <span className="text-sm font-bold tracking-wider uppercase text-text">
            yoink
          </span>
        </div>
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
            spotify downloader
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight">
            <span className="text-lavender">y</span>
            <span className="logo-expand" style={{ animationDelay: "0.3s" }}>o</span>
            <span className="logo-expand" style={{ animationDelay: "0.4s" }}>i</span>
            <span className="logo-expand" style={{ animationDelay: "0.5s" }}>n</span>
            <span className="text-lavender">k</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            grab any spotify track or playlist as a high-quality mp3.
            metadata included. no accounts. no ads. just music.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/app"
              className="btn-press text-sm text-crust bg-lavender hover:bg-mauve px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors duration-200"
            >
              start downloading
            </Link>
            <a
              href="#how"
              className="text-sm text-overlay1 hover:text-text transition-colors duration-200"
            >
              how it works
            </a>
            <Link
              href="/how"
              className="text-sm text-overlay1 hover:text-text transition-colors duration-200"
            >
              local files
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Features */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-16">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            what you get
          </p>
          <div className="space-y-6">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="animate-fade-in-up flex items-baseline gap-3"
                style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
              >
                <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
                <span className="text-sm font-bold text-text">{f.label}</span>
                <span className="text-sm text-subtext0">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* How it works */}
      <section id="how" className="px-6 py-24 max-w-2xl mx-auto scroll-mt-20">
        <div className="space-y-16">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            how it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="animate-fade-in-up space-y-3"
                style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
              >
                <span className="text-3xl font-bold text-surface1">{s.num}</span>
                <p className="text-sm text-subtext0 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Details */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up space-y-6"
          style={{ opacity: 0 }}
        >
          <p className="text-xs text-overlay0 uppercase tracking-[0.3em]">
            the fine print
          </p>
          <div className="space-y-4 text-sm text-overlay1 leading-relaxed">
            <p>
              yoink converts spotify tracks to 320kbps mp3 files with full id3v2
              metadata and embedded album art via ffmpeg. audio is sourced from
              youtube through the piped api.
            </p>
            <p>
              no accounts required. no data stored. your downloads happen
              server-side and stream directly to your browser. nothing is logged
              or saved after the request completes.
            </p>
            <p className="text-overlay0/70 text-xs leading-relaxed">
              yoink is not affiliated with, endorsed by, or connected to
              spotify AB in any way. &quot;spotify&quot; is a trademark of
              spotify AB — we use the name for context only, not to claim
              ownership. yoink does not host any copyrighted material. audio
              is fetched through third-party services at the time of your
              request and is never stored on our servers. this tool is
              intended for personal use — downloading music you already own
              or have the right to access. please respect the rights of
              artists and copyright holders. by using yoink, you agree to
              take responsibility for how you use it.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Support */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up space-y-6"
          style={{ opacity: 0 }}
        >
          <p className="text-xs text-overlay0 uppercase tracking-[0.3em]">
            keep yoink running
          </p>
          <p className="text-sm text-overlay1 leading-relaxed max-w-md">
            yoink is free and always will be. if it saves you time or you just
            think it&apos;s cool, a small tip helps cover server costs.
          </p>
          <a
            href="https://chasefrazier.dev/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press inline-block text-sm text-peach border border-peach/30 hover:bg-peach/10 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-200"
          >
            leave a tip
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-surface0/60 rounded-lg p-8 bg-mantle/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{ opacity: 0 }}
        >
          <div className="space-y-1">
            <p className="text-base font-bold text-text">ready?</p>
            <p className="text-sm text-overlay0">paste a link and go.</p>
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
