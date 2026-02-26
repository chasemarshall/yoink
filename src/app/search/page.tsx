"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import FormatToggle, { type Format } from "@/components/FormatToggle";

interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: string;
  spotifyUrl: string;
  explicit?: boolean;
  previewUrl?: string | null;
}

interface QualityInfo {
  source: string;
  bitrate: string;
}

type PageState = "idle" | "searching" | "results" | "ready" | "downloading" | "done" | "error";

const fallbackTrending = [
  "Kendrick Lamar - Not Like Us",
  "Billie Eilish - Birds of a Feather",
  "Sabrina Carpenter - Espresso",
  "Tyler, The Creator - Noid",
  "SZA - Saturn",
  "Chappell Roan - Good Luck, Babe!",
  "Tyla - Water",
  "Doechii - Nissan Altima",
  "Future - Like That",
  "Metro Boomin - Like That",
];

export default function SearchPage() {
  const [state, setState] = useState<PageState>("idle");
  const [query, setQuery] = useState("");
  const [trending, setTrending] = useState<string[]>(fallbackTrending);

  useEffect(() => {
    fetch("/api/trending")
      .then((res) => res.json())
      .then((data) => { if (data.songs?.length) setTrending(data.songs); })
      .catch(() => {});
  }, []);
  const [results, setResults] = useState<TrackInfo[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackInfo | null>(null);
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [quality, setQuality] = useState<QualityInfo | null>(null);
  const [format, setFormat] = useState<Format>("mp3");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);

  const togglePreview = (url: string) => {
    if (previewPlaying === url) {
      audioRef.current?.pause();
      setPreviewPlaying(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPreviewPlaying(null);
    audioRef.current = audio;
    setPreviewPlaying(url);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setState("searching");
    setError("");
    setIsRateLimited(false);
    setResults([]);
    setSelectedTrack(null);
    setQuality(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json();
        if (data.rateLimit) setIsRateLimited(true);
        throw new Error(data.error || "Search failed");
      }
      const data = await res.json();
      setResults(data.results || []);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setState("error");
    }
  };

  const handleSelect = (track: TrackInfo) => {
    setSelectedTrack(track);
    setState("ready");
  };

  const handleBack = () => {
    audioRef.current?.pause();
    setPreviewPlaying(null);
    setSelectedTrack(null);
    setQuality(null);
    setState("results");
  };

  const handleDownload = useCallback(async () => {
    if (!selectedTrack) return;
    setState("downloading");
    setQuality(null);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selectedTrack.spotifyUrl, format }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.rateLimit) setIsRateLimited(true);
        throw new Error(data.error || "Download failed");
      }

      const audioSource = res.headers.get("X-Audio-Source") || "youtube";
      const audioBitrate = res.headers.get("X-Audio-Quality") || "~160";
      const audioFormat = res.headers.get("X-Audio-Format") || "mp3";

      const extMap: Record<string, string> = { flac: "flac", m4a: "m4a", alac: "m4a", mp3: "mp3" };
      const ext = extMap[audioFormat] || audioFormat;
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${selectedTrack.artist} - ${selectedTrack.name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setQuality({ source: audioSource, bitrate: audioBitrate });
      setState("done");
      setTimeout(() => setState("ready"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setState("error");
    }
  }, [selectedTrack, format]);

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* Title */}
          <div className="space-y-3 animate-fade-in-up" style={{ opacity: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              <span className="text-lavender">s</span>
              <span className="logo-expand" style={{ animationDelay: "0.3s" }}>e</span>
              <span className="logo-expand" style={{ animationDelay: "0.4s" }}>a</span>
              <span className="logo-expand" style={{ animationDelay: "0.45s" }}>r</span>
              <span className="logo-expand" style={{ animationDelay: "0.5s" }}>c</span>
              <span className="text-lavender">h</span>
            </h1>
            <p className="text-sm text-subtext0/80 leading-relaxed max-w-sm">
              type a song name. pick a result. get the {format}.
            </p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="song name, artist..."
                disabled={state === "downloading"}
                className="w-full bg-mantle/50 border border-surface0/60 rounded-lg px-4 py-3.5 text-sm text-text placeholder:text-overlay0/40 focus:outline-none focus:border-lavender/50 transition-colors duration-200 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
              <FormatToggle
                value={format}
                onChange={setFormat}
                disabled={state === "downloading"}
              />
              <span className="text-[10px] text-overlay0/30 tracking-wider">
                {format === "mp3" ? "~8mb per track" : "~40mb per track"}
              </span>
            </div>
          </form>

          {/* Searching */}
          {state === "searching" && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg p-6 flex items-center gap-4 bg-mantle/30" style={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5">
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
              </div>
              <span className="text-sm text-subtext0">searching</span>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="animate-fade-in-up border border-red/20 rounded-lg p-6 space-y-4 bg-red/5" style={{ opacity: 0 }}>
              <div className="flex items-start gap-3">
                <span className="text-red text-xs mt-0.5">!</span>
                <div className="text-sm text-red/90 leading-relaxed">
                  <p>{error}</p>
                  {isRateLimited && (
                    <p className="mt-2 text-xs text-overlay0/60">
                      see{" "}
                      <Link href="/terms" className="text-lavender/70 hover:text-lavender underline transition-colors">
                        rate limits
                      </Link>
                      {" "}for details.{" "}
                      <Link href="/roadmap" className="text-lavender/70 hover:text-lavender underline transition-colors">
                        higher limits coming soon
                      </Link>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setState("idle"); setError(""); setIsRateLimited(false); }}
                className="btn-press text-xs text-subtext0 hover:text-text transition-colors uppercase tracking-wider"
              >
                try again
              </button>
            </div>
          )}

          {/* Search results */}
          {state === "results" && results.length > 0 && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg overflow-hidden bg-mantle/40" style={{ opacity: 0 }}>
              <div className="px-4 sm:px-6 py-3 border-b border-surface0/40">
                <p className="text-xs text-overlay0/60 uppercase tracking-wider">
                  {results.length} result{results.length !== 1 && "s"}
                </p>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {results.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(t)}
                    className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-b border-surface0/20 last:border-b-0 hover:bg-surface0/20 transition-colors duration-150 text-left"
                  >
                    <img
                      src={t.albumArt}
                      alt={t.album}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">
                        {t.name}
                        {t.explicit && (
                          <span className="inline-flex items-center justify-center ml-1 px-0.5 py-px text-[8px] font-bold leading-none uppercase tracking-wide rounded bg-overlay0/20 text-overlay0/70 align-middle">E</span>
                        )}
                      </p>
                      <p className="text-xs text-overlay0 truncate">{t.artist}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-overlay0/50">{t.duration}</p>
                      <p className="text-[10px] text-overlay0/30 truncate max-w-[120px] hidden sm:block">{t.album}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {state === "results" && results.length === 0 && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg p-6 bg-mantle/30" style={{ opacity: 0 }}>
              <p className="text-sm text-subtext0">no results found — try one of these instead</p>
            </div>
          )}

          {/* Selected track card */}
          {selectedTrack && (state === "ready" || state === "downloading" || state === "done") && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg overflow-hidden bg-mantle/40" style={{ opacity: 0 }}>
              {state === "downloading" && (
                <div className="progress-bar h-1 bg-surface0/40">
                  <div className="progress-bar-fill" />
                </div>
              )}
              {state === "done" && (
                <div className="progress-bar h-1 bg-surface0/40">
                  <div className="progress-bar-fill done" />
                </div>
              )}
              {state === "ready" && <div className="h-1" />}

              <div className="p-4 sm:p-6 flex gap-4 sm:gap-5">
                <button
                  className="w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] flex-shrink-0 relative group"
                  onClick={() => selectedTrack.previewUrl && togglePreview(selectedTrack.previewUrl)}
                  disabled={!selectedTrack.previewUrl}
                  title={selectedTrack.previewUrl ? "preview" : "no preview available"}
                >
                  <img
                    src={selectedTrack.albumArt}
                    alt={selectedTrack.album}
                    className="art-glow w-full h-full rounded-lg object-cover animate-fade-in"
                    style={{ opacity: 0 }}
                  />
                  {selectedTrack.previewUrl && (
                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        {previewPlaying === selectedTrack.previewUrl ? (
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        ) : (
                          <path d="M8 5v14l11-7z" />
                        )}
                      </svg>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <p className="text-base font-bold text-text truncate animate-slide-in" style={{ opacity: 0 }}>
                    {selectedTrack.name}
                    {selectedTrack.explicit && (
                      <span className="inline-flex items-center justify-center ml-1.5 px-1 py-px text-[9px] font-bold leading-none uppercase tracking-wide rounded bg-overlay0/20 text-overlay0 align-middle">E</span>
                    )}
                  </p>
                  <p className="text-sm text-subtext0 truncate animate-slide-in" style={{ opacity: 0, animationDelay: "60ms" }}>
                    {selectedTrack.artist}
                  </p>
                  <div className="flex items-center gap-3 animate-slide-in" style={{ opacity: 0, animationDelay: "120ms" }}>
                    <p className="text-xs text-overlay0 truncate">{selectedTrack.album}</p>
                    <span className="text-overlay0/40">·</span>
                    <p className="text-xs text-overlay0 flex-shrink-0">{selectedTrack.duration}</p>
                  </div>
                  {quality && state === "done" && (
                    <p className="text-[10px] text-overlay0/60 animate-fade-in" style={{ opacity: 0 }}>
                      {quality.bitrate === "lossless" ? "lossless" : `${quality.source === "youtube" ? "~" : ""}${quality.bitrate}kbps`} via {quality.source}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-surface0/60 flex">
                <button
                  onClick={handleDownload}
                  disabled={state === "downloading"}
                  className={`btn-press flex-1 px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 hover:bg-surface0/20 ${
                    state === "done"
                      ? "text-green"
                      : state === "downloading"
                        ? "text-lavender/70"
                        : "text-lavender"
                  }`}
                >
                  {state === "downloading" && (
                    <span className="inline-flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="loading-dot w-1 h-1 rounded-full bg-lavender/70" />
                        <span className="loading-dot w-1 h-1 rounded-full bg-lavender/70" />
                        <span className="loading-dot w-1 h-1 rounded-full bg-lavender/70" />
                      </span>
                      downloading
                    </span>
                  )}
                  {state === "done" && "downloaded"}
                  {state === "ready" && `download ${format}`}
                </button>
                <button
                  onClick={handleBack}
                  disabled={state === "downloading"}
                  className="btn-press px-5 py-3.5 text-xs text-overlay0 hover:text-text hover:bg-surface0/20 border-l border-surface0/60 transition-all duration-200 uppercase tracking-wider disabled:opacity-50"
                >
                  back
                </button>
              </div>
            </div>
          )}

          {/* Trending + keyboard hint */}
          {(state === "idle" || (state === "results" && results.length === 0)) && (
            <div className="space-y-6">
              <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: "200ms" }}>
                <p className="text-[10px] text-overlay0/40 uppercase tracking-[0.2em] mb-3">trending</p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((song, i) => (
                    <button
                      key={song}
                      onClick={() => {
                        setQuery(song);
                        setState("searching");
                        setError("");
                        setResults([]);
                        setSelectedTrack(null);
                        setQuality(null);
                        fetch(`/api/search?q=${encodeURIComponent(song)}`)
                          .then((res) => res.ok ? res.json() : Promise.reject())
                          .then((data) => { setResults(data.results || []); setState("results"); })
                          .catch(() => { setError("Search failed"); setState("error"); });
                      }}
                      className="animate-fade-in-up text-[11px] text-overlay1/70 hover:text-lavender border border-surface0/40 hover:border-lavender/30 rounded-full px-3 py-1.5 transition-colors duration-200"
                      style={{ opacity: 0, animationDelay: `${250 + i * 40}ms` }}
                    >
                      {song}
                    </button>
                  ))}
                </div>
              </div>
              {state === "idle" && (
                <div className="animate-fade-in-up flex items-center gap-2 text-xs text-overlay0/40" style={{ opacity: 0, animationDelay: "650ms" }}>
                  <kbd className="px-1.5 py-0.5 rounded border border-surface0/60 text-overlay0/50 text-[10px]">Enter</kbd>
                  <span>to search</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
          <span>search + download</span>
        </div>
      </footer>
    </div>
  );
}
