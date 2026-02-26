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
          href="https://bsky.app/profile/yoinkify.lol"
          target="_blank"
          rel="noopener noreferrer"
          className="text-overlay0 hover:text-sky transition-colors duration-200"
          aria-label="bluesky"
        >
          <svg width="16" height="16" viewBox="0 0 600 530" fill="currentColor">
            <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.72 40.255-67.24 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
          </svg>
        </a>
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
