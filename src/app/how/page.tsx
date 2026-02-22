"use client";

import Link from "next/link";

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
            yoink gives you the file. spotify plays it back — no premium
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
            className="animate-fade-in-up flex items-center gap-3 text-sm flex-wrap"
            style={{ opacity: 0, animationDelay: "80ms" }}
          >
            <span className="text-lavender font-bold">yoink it</span>
            <span className="text-surface2">→</span>
            <span className="text-text font-bold">save to your music folder</span>
            <span className="text-surface2">→</span>
            <span className="text-green font-bold">plays in spotify, ad-free</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Why */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-12">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            why local files
          </p>
          <div className="space-y-6">
            <div
              className="animate-fade-in-up flex items-baseline gap-3"
              style={{ opacity: 0 }}
            >
              <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
              <span className="text-sm font-bold text-text">no ads</span>
              <span className="text-sm text-subtext0">local files play without any interruptions. no audio ads, no banners, no upsells.</span>
            </div>
            <div
              className="animate-fade-in-up flex items-baseline gap-3"
              style={{ opacity: 0, animationDelay: "80ms" }}
            >
              <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
              <span className="text-sm font-bold text-text">stays in spotify</span>
              <span className="text-sm text-subtext0">your downloads live alongside your streaming library. same playlists, same queue, same app.</span>
            </div>
            <div
              className="animate-fade-in-up flex items-baseline gap-3"
              style={{ opacity: 0, animationDelay: "160ms" }}
            >
              <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
              <span className="text-sm font-bold text-text">works offline</span>
              <span className="text-sm text-subtext0">local files don&apos;t need a connection. airplane mode, no wifi — doesn&apos;t matter.</span>
            </div>
            <div
              className="animate-fade-in-up flex items-baseline gap-3"
              style={{ opacity: 0, animationDelay: "240ms" }}
            >
              <span className="text-sm text-surface2 flex-shrink-0">[*]</span>
              <span className="text-sm font-bold text-text">no premium needed</span>
              <span className="text-sm text-subtext0">local files work on the free tier. you don&apos;t need spotify premium for any of this.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Desktop Setup */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-12">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            setup — desktop
          </p>

          {/* Step 1 */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0 }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">01</span>
              <p className="text-sm font-bold text-text">open settings</p>
            </div>
            <div className="pl-12 space-y-2">
              <p className="text-sm text-subtext0 leading-relaxed">
                open the spotify desktop app. click your <span className="text-text font-bold">profile picture</span> in the top-right corner, then click <span className="text-text font-bold">settings</span>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "80ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">02</span>
              <p className="text-sm font-bold text-text">enable local files</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                scroll down to <span className="text-text font-bold">your library</span> and toggle <span className="text-text font-bold">show local files</span> to on.
              </p>
              <div className="border border-surface0/60 rounded-lg p-4 bg-mantle/40 space-y-3 max-w-sm">
                <p className="text-xs font-bold text-text">Your Library</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtext0">Show Local Files</span>
                  <div className="w-8 h-4 rounded-full bg-lavender/80 flex items-center justify-end px-0.5">
                    <div className="w-3 h-3 rounded-full bg-crust" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "160ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">03</span>
              <p className="text-sm font-bold text-text">choose your music folder</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                right below that, you&apos;ll see <span className="text-text font-bold">show songs from</span>. you have two options:
              </p>
              <div className="space-y-2 text-sm text-subtext0">
                <p>
                  <span className="text-lavender font-bold">option a</span> — enable <span className="text-text font-bold">Downloads</span> or <span className="text-text font-bold">My Music</span> and save your yoink files there.
                </p>
                <p>
                  <span className="text-lavender font-bold">option b</span> — click <span className="text-text font-bold">add a source</span> and point it at whatever folder you save your music to.
                </p>
              </div>
              <div className="border border-surface0/60 rounded-lg p-4 bg-mantle/40 space-y-2.5 max-w-sm">
                <p className="text-xs font-bold text-text">Show songs from</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtext0">Downloads</span>
                  <div className="w-8 h-4 rounded-full bg-lavender/80 flex items-center justify-end px-0.5">
                    <div className="w-3 h-3 rounded-full bg-crust" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtext0">My Music</span>
                  <div className="w-8 h-4 rounded-full bg-surface1 flex items-center justify-start px-0.5">
                    <div className="w-3 h-3 rounded-full bg-overlay0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "240ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">04</span>
              <p className="text-sm font-bold text-text">find your tracks</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                go to your library. you&apos;ll see a playlist called <span className="text-text font-bold">Local Files</span> — it has a folder icon with a blue background. every file you save to your music folder shows up there with full metadata and album art, ready to play.
              </p>
              <div className="border border-surface0/60 rounded-lg p-3 bg-mantle/40 inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-text">Local Files</p>
                  <p className="text-[10px] text-overlay0">your library</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Mobile */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <div className="space-y-12">
          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            setup — iphone
          </p>

          {/* Step 1 — Profile */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0 }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">01</span>
              <p className="text-sm font-bold text-text">tap your profile picture</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                open the spotify app. tap your <span className="text-text font-bold">profile picture</span> in the top-left corner.
              </p>
              {/* Spotify mobile top bar mockup */}
              <div className="border border-surface0/60 rounded-xl overflow-hidden bg-mantle/40 max-w-xs">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lavender/40 ring-2 ring-lavender/60 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-lavender">Y</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text">All</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="text-[9px] text-overlay0 bg-surface0/60 rounded-full px-2 py-0.5">Music</span>
                        <span className="text-[9px] text-overlay0 bg-surface0/60 rounded-full px-2 py-0.5">Podcasts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 — Settings and Privacy */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "80ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">02</span>
              <p className="text-sm font-bold text-text">settings and privacy</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                tap <span className="text-text font-bold">Settings and privacy</span> from the menu.
              </p>
              {/* Profile menu mockup */}
              <div className="border border-surface0/60 rounded-xl overflow-hidden bg-mantle/40 max-w-xs">
                {/* Header with profile */}
                <div className="px-4 py-3 border-b border-surface0/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lavender/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-lavender">Y</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text">Your Name</p>
                    <p className="text-[10px] text-overlay0">View profile</p>
                  </div>
                </div>
                {/* Menu items */}
                <div className="px-4 py-2">
                  <div className="py-2.5 opacity-40">
                    <span className="text-xs text-subtext0">Add account</span>
                  </div>
                  <div className="py-2.5 opacity-40">
                    <span className="text-xs text-subtext0">What&apos;s new</span>
                  </div>
                  <div className="py-2.5 opacity-40">
                    <span className="text-xs text-subtext0">Recents</span>
                  </div>
                  <div className="py-2.5 flex items-center gap-2.5 bg-lavender/8 -mx-4 px-4 rounded">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-lavender flex-shrink-0">
                      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-xs font-bold text-lavender">Settings and privacy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 — Apps and Devices */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "160ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">03</span>
              <p className="text-sm font-bold text-text">apps and devices</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                scroll down and tap <span className="text-text font-bold">Apps and devices</span>.
              </p>
              {/* Settings page mockup */}
              <div className="border border-surface0/60 rounded-xl overflow-hidden bg-mantle/40 max-w-xs">
                <div className="px-4 py-2.5 border-b border-surface0/30">
                  <p className="text-xs font-bold text-text">Settings and privacy</p>
                </div>
                <div className="px-4 py-2">
                  <div className="py-2.5 flex items-center justify-between opacity-40">
                    <span className="text-xs text-subtext0">Data Saver</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-surface2"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="py-2.5 flex items-center justify-between opacity-40">
                    <span className="text-xs text-subtext0">Playback</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-surface2"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="py-2.5 flex items-center justify-between bg-lavender/8 -mx-4 px-4 rounded">
                    <span className="text-xs font-bold text-lavender">Apps and devices</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-lavender"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="py-2.5 flex items-center justify-between opacity-40">
                    <span className="text-xs text-subtext0">Storage</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-surface2"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 — Local Audio Files toggle */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "240ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">04</span>
              <p className="text-sm font-bold text-text">toggle on local audio files</p>
            </div>
            <div className="pl-12 space-y-3">
              <p className="text-sm text-subtext0 leading-relaxed">
                toggle <span className="text-text font-bold">Local audio files</span> to on.
              </p>
              {/* Apps and devices page mockup */}
              <div className="border border-surface0/60 rounded-xl overflow-hidden bg-mantle/40 max-w-xs">
                <div className="px-4 pt-4 pb-2">
                  <p className="text-sm font-bold text-text">Other devices</p>
                </div>
                <div className="px-4 pb-4 space-y-4">
                  <div className="opacity-40">
                    <p className="text-xs text-text">Spotify Connect control</p>
                  </div>
                  <div className="opacity-40">
                    <p className="text-xs text-text">Local device visibility</p>
                  </div>
                  <div className="bg-lavender/8 -mx-4 px-4 py-2 rounded flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-lavender">Local audio files</p>
                      <p className="text-[10px] text-lavender/60 mt-0.5 leading-relaxed">Lets you add tracks from this device to Your Library.</p>
                    </div>
                    <div className="w-9 h-5 rounded-full bg-lavender/80 flex items-center justify-end px-0.5 flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-crust" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider between enable and move */}
          <div className="border-t border-surface0/30" />

          <p
            className="text-xs text-overlay0 uppercase tracking-[0.3em] animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            move songs — iphone
          </p>

          {/* Step 5 — Find your download */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0 }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">05</span>
              <p className="text-sm font-bold text-text">find your download</p>
            </div>
            <div className="pl-12">
              <p className="text-sm text-subtext0 leading-relaxed">
                open the <span className="text-text font-bold">Files</span> app on your iphone. go to the <span className="text-text font-bold">Browse</span> tab and tap <span className="text-text font-bold">Downloads</span> — your song will be there.
              </p>
            </div>
          </div>

          {/* Step 6 — Copy */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "80ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">06</span>
              <p className="text-sm font-bold text-text">copy the file</p>
            </div>
            <div className="pl-12">
              <p className="text-sm text-subtext0 leading-relaxed">
                tap and hold the file, then tap <span className="text-text font-bold">Copy</span> from the context menu.
              </p>
            </div>
          </div>

          {/* Step 7 — Navigate to Spotify folder */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "160ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">07</span>
              <p className="text-sm font-bold text-text">find the spotify folder</p>
            </div>
            <div className="pl-12">
              <p className="text-sm text-subtext0 leading-relaxed">
                go back to <span className="text-text font-bold">Browse</span>, tap <span className="text-text font-bold">On My iPhone</span>, and scroll down until you see the <span className="text-text font-bold">Spotify</span> folder — it has the green spotify icon.
              </p>
            </div>
          </div>

          {/* Step 8 — Paste */}
          <div
            className="animate-fade-in-up space-y-4"
            style={{ opacity: 0, animationDelay: "240ms" }}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-surface1">08</span>
              <p className="text-sm font-bold text-text">paste and play</p>
            </div>
            <div className="pl-12">
              <p className="text-sm text-subtext0 leading-relaxed">
                tap and hold a blank spot inside the folder, then tap <span className="text-text font-bold">Paste</span>. open spotify — your tracks show up under <span className="text-text font-bold">Your Library → Local Files</span>. no premium needed.
              </p>
            </div>
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
