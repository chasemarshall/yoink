"use client";

import Link from "next/link";

interface Section {
  title: string;
  content: string[];
}

const sections: Section[] = [
  {
    title: "what yoink is",
    content: [
      "yoink is a free tool that lets you download music files from publicly available sources on the internet. we use spotify's public API for metadata (track info, album art, lyrics) and fetch audio from third-party services.",
      "we are not affiliated with, endorsed by, or connected to spotify, apple, youtube, deezer, tidal, or any other streaming platform. all trademarks belong to their respective owners.",
    ],
  },
  {
    title: "your responsibility",
    content: [
      "you are solely responsible for how you use yoink. this tool is intended for personal, non-commercial use only — specifically for downloading music you already own or have the legal right to access.",
      "you agree not to use yoink to infringe on the rights of artists, labels, or copyright holders. we don't monitor what you download, but you're expected to respect applicable copyright laws in your jurisdiction.",
    ],
  },
  {
    title: "no guarantees",
    content: [
      "yoink is provided \"as is\" with no warranties of any kind. we don't guarantee uptime, audio quality, metadata accuracy, or that any specific track will be available.",
      "audio sources may go down, APIs may change, and features may break. we'll do our best to keep things running, but we make no promises.",
    ],
  },
  {
    title: "rate limits",
    content: [
      "to keep the service fair for everyone, yoink enforces rate limits on all endpoints. current limits: 30 downloads per minute, 5 playlist downloads per minute (max 200 tracks per playlist), 15 searches per minute, and 10 metadata lookups per minute.",
      "if you hit a limit, wait a bit and try again. don't try to circumvent rate limits — doing so may result in your access being restricted.",
    ],
  },
  {
    title: "DMCA & takedowns",
    content: [
      "yoink does not host, store, or cache any copyrighted audio files on its servers. all audio is fetched from third-party sources in real-time and delivered directly to you. nothing is retained after your request completes.",
      "if you believe your copyrighted work is being accessed through yoink in a way that constitutes infringement, contact us at dmca@yoinkify.lol with details and we will promptly address valid concerns.",
    ],
  },
  {
    title: "termination",
    content: [
      "we reserve the right to restrict or terminate access to yoink at any time, for any reason, without notice. this includes (but isn't limited to) abuse, excessive usage, or attempts to circumvent rate limits.",
    ],
  },
  {
    title: "self-hosting",
    content: [
      "yoink offers a docker image for self-hosting. if you run your own instance, you're responsible for your own compliance with applicable laws and the terms of any third-party APIs you use.",
    ],
  },
  {
    title: "changes",
    content: [
      "we may update these terms at any time. continued use of yoink after changes means you accept the updated terms. we won't send you an email about it — check back here if you care.",
    ],
  },
];

export default function TermsPage() {
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
      <section className="px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 max-w-2xl mx-auto">
        <div className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="text-xs text-lavender uppercase tracking-[0.3em] font-bold">
            legal
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            terms of
            <br />
            <span className="text-lavender">service.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            the boring but necessary stuff. read it or don&apos;t — using
            yoink means you agree.
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
          <p className="text-sm font-bold text-text">questions?</p>
          <p className="text-sm text-subtext0/80 leading-relaxed">
            if you have questions about these terms or need to report a
            copyright concern, reach out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <a
              href="mailto:me@yoinkify.lol"
              className="text-sm text-lavender hover:text-mauve transition-colors duration-200"
            >
              me@yoinkify.lol
            </a>
            <a
              href="mailto:dmca@yoinkify.lol"
              className="text-sm text-overlay0 hover:text-text transition-colors duration-200"
            >
              dmca@yoinkify.lol
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>yoink</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/privacy" className="hover:text-text transition-colors duration-200">privacy</Link>
          <Link href="/roadmap" className="hover:text-text transition-colors duration-200">roadmap</Link>
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
