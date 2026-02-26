"use client";

import Link from "next/link";

interface Section {
  title: string;
  content: (string | React.ReactNode)[];
}

const sections: Section[] = [
  {
    title: "the short version",
    content: [
      "yoink doesn't have accounts, doesn't store your downloads, and only collects anonymous page view stats. we keep the bare minimum to keep the service running. that's it.",
    ],
  },
  {
    title: "no accounts, minimal analytics",
    content: [
      "yoink has no user accounts, no sign-ups, no cookies, and no ad trackers. we don't use google analytics, facebook pixel, or any invasive tracking service.",
      "we use umami for basic, anonymous usage analytics — page views and visit counts. umami is privacy-focused, doesn't use cookies, doesn't collect personal data, and is fully GDPR compliant. we use it to understand which pages get traffic, not to track individual users.",
      "we don't know who you are or what you download.",
    ],
  },
  {
    title: "what we don't store",
    content: [
      "audio files are fetched in real-time from third-party sources, processed in memory, and delivered directly to your browser. nothing is cached, stored, or retained on our servers after your request completes.",
      "we don't keep download history, search queries, or any record of what tracks you've requested.",
    ],
  },
  {
    title: "server logs",
    content: [
      "our hosting provider (railway) may collect basic server logs — things like IP addresses, request timestamps, and HTTP status codes. these are standard infrastructure logs used for debugging and abuse prevention.",
      "we don't actively analyze these logs to identify individual users. they're automatically rotated and deleted by the hosting provider.",
    ],
  },
  {
    title: "rate limiting",
    content: [
      "yoink uses in-memory rate limiting based on your IP address to prevent abuse. this data is stored only in server memory, is never written to disk, and is lost whenever the server restarts. we don't build profiles or track usage patterns.",
      <>current limits: 30 downloads per minute, 5 playlist downloads per minute (max 200 tracks per playlist), 15 searches per minute, and 10 metadata lookups per minute. higher limits may be available in the future — check the <Link href="/roadmap" className="text-lavender/70 hover:text-lavender underline transition-colors">roadmap</Link>.</>,
    ],
  },
  {
    title: "third-party services",
    content: [
      "to fetch metadata and audio, yoink communicates with several third-party APIs on your behalf. these services may have their own privacy policies:",
      "spotify web API — for track metadata, album art, and search. apple's itunes search API — for genre data and catalog matching. lrclib — for lyrics. audio is sourced from publicly available third-party services.",
      "yoink sends the minimum data required to these services (track names, artist names, URLs). we don't send any personal information about you.",
    ],
  },
  {
    title: "self-hosted instances",
    content: [
      "if you self-host yoink using our docker image, your instance is entirely under your control. we have no visibility into self-hosted deployments and collect no data from them.",
    ],
  },
  {
    title: "children",
    content: [
      "yoink is not directed at children under 13. we don't knowingly collect any personal information from anyone, let alone minors.",
    ],
  },
  {
    title: "changes",
    content: [
      "if we ever change how we handle data (we probably won't), we'll update this page. no email notifications — just check back here.",
    ],
  },
];

export default function PrivacyPage() {
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
            legal
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            privacy
            <br />
            <span className="text-lavender">policy.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            we don&apos;t track you. we don&apos;t store your data. here&apos;s
            the full breakdown.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* TLDR banner */}
      <section className="px-6 py-12 sm:py-16 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-green/20 rounded-lg p-5 bg-green/5 space-y-2"
          style={{ opacity: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green" />
            <p className="text-sm font-bold text-green">tldr</p>
          </div>
          <p className="text-sm text-subtext0/80 leading-relaxed">
            no accounts. no cookies. no download history. audio is
            processed in memory and never saved. anonymous page view analytics
            via umami (no personal data). IP used for rate limiting only, kept
            in volatile memory.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Sections */}
      {sections.map((section, sectionIdx) => (
        <div key={section.title}>
          <section className="px-6 py-12 sm:py-16 max-w-2xl mx-auto">
            <div
              className="animate-fade-in-up space-y-4"
              style={{ opacity: 0, animationDelay: `${sectionIdx * 60}ms` }}
            >
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-surface2">
                  {String(sectionIdx + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-bold text-text">{section.title}</p>
              </div>
              <div className="pl-10 sm:pl-12 space-y-3">
                {section.content.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-sm text-subtext0/80 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {sectionIdx < sections.length - 1 && (
            <div className="max-w-2xl mx-auto px-6">
              <div className="border-t border-surface0/30" />
            </div>
          )}
        </div>
      ))}

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Contact */}
      <section className="px-6 py-12 sm:py-16 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up border border-surface0/60 rounded-lg p-6 sm:p-8 bg-mantle/40 space-y-4"
          style={{ opacity: 0 }}
        >
          <p className="text-sm font-bold text-text">questions about your data?</p>
          <p className="text-sm text-subtext0/80 leading-relaxed">
            we probably don&apos;t have any data about you, but if you have
            concerns, reach out.
          </p>
          <a
            href="mailto:me@yoinkify.lol"
            className="text-sm text-lavender hover:text-mauve transition-colors duration-200 inline-block"
          >
            me@yoinkify.lol
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>yoink</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/terms" className="hover:text-text transition-colors duration-200">terms</Link>
          <Link href="/roadmap" className="hover:text-text transition-colors duration-200">roadmap</Link>
          <a href="https://bsky.app/profile/yoinkify.lol" target="_blank" rel="noopener noreferrer" className="hover:text-sky transition-colors duration-200">bluesky</a>
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
