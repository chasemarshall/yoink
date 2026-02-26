"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const formats = ["flac", "alac", "mp3"];

const steps = [
  { num: "01", text: "paste a spotify link" },
  { num: "02", text: "metadata pulled from spotify" },
  { num: "03", text: "audio sourced from the web" },
  { num: "04", text: "tagged, converted, delivered" },
];

export default function LandingPage() {
  const [formatIndex, setFormatIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setFormatIndex((prev) => (prev + 1) % formats.length);
        setIsAnimating(false);
      }, 200);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-grid">
      {/* Nav */}
      <nav className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/status" className="status-dot w-2 h-2 rounded-full bg-green hover:shadow-[0_0_8px_rgba(166,227,161,0.6)] transition-shadow" />
          <span className="text-sm font-bold tracking-wider uppercase text-text hover:text-lavender transition-colors cursor-default">
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
      <section className="px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 max-w-2xl mx-auto">
        <div className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="text-xs text-lavender uppercase tracking-[0.3em] font-bold">
            spotify to mp3 — and more
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight">
            <span className="text-lavender">y</span>
            <span className="logo-expand" style={{ animationDelay: "0.3s" }}>o</span>
            <span className="logo-expand" style={{ animationDelay: "0.4s" }}>i</span>
            <span className="logo-expand" style={{ animationDelay: "0.5s" }}>n</span>
            <span className="text-lavender">k</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            paste a spotify link. get the file in{" "}
            <span
              className={`text-lavender font-bold transition-all duration-300 ease-out origin-center ${
                isAnimating
                  ? "opacity-0"
                  : "opacity-100"
              }`}
              style={{
                display: "inline",
                filter: isAnimating ? "blur(4px)" : "blur(0px)",
                transform: isAnimating ? "scale(0.5)" : "scale(1)",
                transformOrigin: "center",
              }}
            >
              {formats[formatIndex]}
            </span>
            . metadata, lyrics, cover art. no accounts, no ads.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/app"
              className="btn-press text-sm text-crust bg-lavender hover:bg-mauve px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors duration-200"
            >
              start downloading
            </Link>
            <Link
              href="/how"
              className="text-sm text-mauve hover:text-lavender transition-colors duration-200"
            >
              local files setup
            </Link>
          </div>
        </div>
      </section>

      {/* Status notice */}
      {!bannerDismissed && (
        <div className="max-w-2xl mx-auto px-6 pb-2">
          <div
            className="animate-fade-in-up flex items-start gap-3 border border-peach/15 rounded-lg px-4 py-3.5 bg-peach/[0.03]"
            style={{ opacity: 0, animationDelay: "200ms" }}
          >
            <div className="w-1 self-stretch rounded-full bg-peach/30 shrink-0" />
            <p className="text-xs text-subtext0/70 leading-relaxed flex-1">
              hey — we&apos;ve been hitting spotify api limits today. downloads still work but might be a bit slower while we pull from backup sources. sorry about that, working on it.
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-overlay0/30 hover:text-overlay0/60 transition-colors shrink-0 mt-px"
              aria-label="dismiss"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* How it works */}
      <section id="how" className="px-6 py-16 sm:py-24 max-w-2xl mx-auto scroll-mt-20">
        <div className="space-y-12">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            how it works
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="animate-fade-in-up space-y-2"
                style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
              >
                <span className="text-2xl font-bold text-surface2">{s.num}</span>
                <p className="text-xs text-subtext0 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Features */}
      <section className="px-6 py-16 sm:py-24 max-w-2xl mx-auto">
        <div className="space-y-12">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            what you get
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              className="animate-fade-in-up space-y-3 border border-surface0/40 rounded-lg p-5 bg-mantle/30"
              style={{ opacity: 0 }}
            >
              <p className="text-sm font-bold text-text">tracks</p>
              <p className="text-xs text-subtext0 leading-relaxed">
                paste a link. we match the song, find the audio, and tag it with full metadata — title, artist, album, cover art, lyrics.
              </p>
            </div>
            <div
              className="animate-fade-in-up space-y-3 border border-surface0/40 rounded-lg p-5 bg-mantle/30"
              style={{ opacity: 0, animationDelay: "80ms" }}
            >
              <p className="text-sm font-bold text-text">playlists & albums</p>
              <p className="text-xs text-subtext0 leading-relaxed">
                paste a playlist or album link. preview every track. download them all as a tagged zip.
              </p>
            </div>
            <div
              className="animate-fade-in-up space-y-3 border border-surface0/40 rounded-lg p-5 bg-mantle/30"
              style={{ opacity: 0, animationDelay: "160ms" }}
            >
              <p className="text-sm font-bold text-text">lossless</p>
              <p className="text-xs text-subtext0 leading-relaxed">
                mp3 at 320kbps, or lossless in flac and alac. choose your format before you download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Support + CTA */}
      <section className="px-6 py-16 sm:py-24 max-w-2xl mx-auto">
        <div className="space-y-12">
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
        </div>
      </section>

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

      {/* Footer with fine print */}
      <footer className="border-t border-surface0/40 px-6 py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs text-overlay0/50">
          <span>yoink</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/how" className="text-mauve/60 hover:text-mauve transition-colors duration-200">local files</Link>
            <Link href="/players" className="text-green/60 hover:text-green transition-colors duration-200">players</Link>
            <Link href="/roadmap" className="hover:text-text transition-colors duration-200">roadmap</Link>
            <Link href="/terms" className="hover:text-text transition-colors duration-200">terms</Link>
            <Link href="/privacy" className="hover:text-text transition-colors duration-200">privacy</Link>
            <a href="https://bsky.app/profile/yoinkify.lol" target="_blank" rel="noopener noreferrer" className="hover:text-sky transition-colors duration-200">bluesky</a>
            <a href="https://chasefrazier.dev/tip" target="_blank" rel="noopener noreferrer" className="hover:text-peach transition-colors duration-200">tip jar</a>
          </div>
        </div>
        <div className="space-y-3 text-[10px] text-overlay0/40 leading-relaxed">
          <p>
            yoink is not affiliated with, endorsed by, or connected to
            spotify AB or any other streaming service. &quot;spotify&quot; is a
            trademark of spotify AB — we use the name for context only, not
            to claim ownership. yoink does not host, store, or archive any
            copyrighted material on its servers. free third-party services
            are used to search for and retrieve audio. no content is cached
            or retained after your request completes.
          </p>
          <p>
            this tool is intended for personal and non-commercial use only —
            downloading music you already own or have the right to access.
            users are solely responsible for ensuring compliance with
            applicable copyright laws and the terms of service of any
            streaming platform. yoink is not responsible for any violation
            of applicable laws. by using yoink, you agree to take full
            responsibility for how you use it. please respect the rights of
            artists and copyright holders.
          </p>
          <p>
            if you believe that your copyrighted work is being used in a way
            that constitutes infringement, please contact us at{" "}
            <a href="mailto:dmca@yoinkify.lol" className="underline hover:text-overlay0/60">
              dmca@yoinkify.lol
            </a>{" "}
            and we will promptly address any valid concerns.
          </p>
        </div>
      </footer>
    </div>
  );
}
