"use client";

import Link from "next/link";

const benefits = [
  {
    label: "no ads",
    desc: "local files play without any interruptions. no audio ads, no banners, no upsells. just your music.",
  },
  {
    label: "stays in spotify",
    desc: "your downloads live right alongside your streaming library. same playlists, same queue, same app.",
  },
  {
    label: "works offline",
    desc: "downloaded tracks don't need a connection. airplane mode? no problem.",
  },
];

const steps = [
  {
    num: "01",
    title: "open spotify settings",
    desc: "launch the spotify desktop app. click your profile picture in the top-right corner, then click settings.",
  },
  {
    num: "02",
    title: "enable local files",
    desc: "scroll down to \"your library\" and toggle \"show local files\" to on.",
  },
  {
    num: "03",
    title: "add your music source",
    desc: "scroll down to \"show songs from\". you can enable the default sources (downloads, my music) or click \"add a source\" to point spotify at whatever folder yoink saves to.",
  },
  {
    num: "04",
    title: "find your tracks",
    desc: "go to your library → local files. everything yoink downloaded — with full metadata and album art — shows up ready to play.",
  },
];

export default function HowPage() {
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
            local files guide
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            keep your music.
            <br />
            <span className="text-lavender">skip the ads.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            yoink grabs the mp3. spotify plays it back — no premium
            required, no ads, no limits. here&apos;s how to set it up.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* The loop */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-16">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            the loop
          </p>
          <div
            className="animate-fade-in-up flex items-center gap-3 text-sm"
            style={{ opacity: 0, animationDelay: "80ms" }}
          >
            <span className="text-lavender font-bold">yoink it</span>
            <span className="text-surface2">→</span>
            <span className="text-text font-bold">drop it in spotify</span>
            <span className="text-surface2">→</span>
            <span className="text-green font-bold">listen ad-free</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Why */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-16">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            why local files
          </p>
          <div className="space-y-6">
            {benefits.map((b, i) => (
              <div
                key={b.label}
                className="animate-fade-in-up flex items-baseline gap-3"
                style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
              >
                <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
                <span className="text-sm font-bold text-text">{b.label}</span>
                <span className="text-sm text-subtext0">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Steps */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-16">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            setup — desktop
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="animate-fade-in-up space-y-3"
                style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
              >
                <span className="text-3xl font-bold text-surface1">
                  {s.num}
                </span>
                <p className="text-sm font-bold text-text">{s.title}</p>
                <p className="text-sm text-subtext0 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Mobile note */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up space-y-6"
          style={{ opacity: 0 }}
        >
          <p className="text-xs text-overlay0 uppercase tracking-[0.3em]">
            mobile sync
          </p>
          <div className="border border-surface0/60 rounded-lg p-6 bg-mantle/40 space-y-3">
            <p className="text-sm font-bold text-text">
              want local files on your phone?
            </p>
            <p className="text-sm text-overlay1 leading-relaxed">
              add your local tracks to a playlist on desktop. open spotify on
              your phone while on the same wifi network. the playlist will show
              your local files — tap download and they&apos;re saved to your
              device. no premium needed for local file sync.
            </p>
          </div>
        </div>
      </section>

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
            <p className="text-base font-bold text-text">ready to yoink?</p>
            <p className="text-sm text-overlay0">
              grab your first track and set up local files.
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
