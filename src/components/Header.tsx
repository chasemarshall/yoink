"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Link href="/status" className="status-dot w-2 h-2 rounded-full bg-green hover:shadow-[0_0_8px_rgba(166,227,161,0.6)] transition-shadow" />
        <Link href="/" className="text-sm font-bold tracking-wider uppercase text-text hover:text-lavender transition-colors">
          yoink
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-overlay0 hidden sm:block">spotify downloader</span>
        <a
          href="https://chasefrazier.dev/tip"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-overlay0 hover:text-peach transition-colors duration-200"
        >
          tip jar
        </a>
        <Link href="/roadmap" className="text-xs text-surface2 hover:text-lavender transition-colors duration-200">v3.0</Link>
      </div>
    </header>
  );
}
