"use client";

import { useState } from "react";
import Header from "@/components/Header";
import SpotifyInput from "@/components/SpotifyInput";

interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: string;
  spotifyUrl: string;
}

type AppState = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (url: string) => {
    setState("fetching");
    setError("");
    setTrack(null);

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch track info");
      }

      const data = await res.json();
      setTrack(data);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const handleDownload = async () => {
    if (!track) return;
    setState("downloading");

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: track.spotifyUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Download failed");
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${track.artist} - ${track.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setState("done");
      setTimeout(() => setState("ready"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setTrack(null);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* Title */}
          <div className="space-y-3 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0ms" }}>
            <h1 className="text-4xl sm:text-5xl font-bold text-text leading-tight">
              spot<span className="text-lavender">.dl</span>
            </h1>
            <p className="text-sm text-subtext0/80 leading-relaxed max-w-sm">
              paste a spotify link. get the mp3.<br />
              metadata included.
            </p>
          </div>

          {/* Input */}
          <SpotifyInput
            onSubmit={handleSubmit}
            disabled={state === "fetching" || state === "downloading"}
          />

          {/* Loading */}
          {state === "fetching" && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg p-6 flex items-center gap-4 bg-mantle/30" style={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5">
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
                <div className="loading-dot w-1.5 h-1.5 rounded-full bg-lavender" />
              </div>
              <span className="text-sm text-subtext0">fetching track info</span>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="animate-fade-in-up border border-red/20 rounded-lg p-6 space-y-4 bg-red/5" style={{ opacity: 0 }}>
              <div className="flex items-start gap-3">
                <span className="text-red text-xs mt-0.5">!</span>
                <p className="text-sm text-red/90 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="btn-press text-xs text-subtext0 hover:text-text transition-colors uppercase tracking-wider"
              >
                try again
              </button>
            </div>
          )}

          {/* Track Card */}
          {track && (state === "ready" || state === "downloading" || state === "done") && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg overflow-hidden bg-mantle/40" style={{ opacity: 0 }}>
              {/* Progress indicators */}
              {state === "downloading" && (
                <div className="shimmer-bar h-0.5 bg-lavender/30">
                  <div className="h-full bg-lavender w-full" />
                </div>
              )}
              {state === "done" && (
                <div className="h-0.5 bg-green animate-fade-in" />
              )}
              {state === "ready" && <div className="h-0.5" />}

              <div className="p-6 flex gap-5 stagger">
                {/* Album Art */}
                <img
                  src={track.albumArt}
                  alt={track.album}
                  className="art-glow w-[100px] h-[100px] rounded-lg object-cover flex-shrink-0 animate-fade-in"
                  style={{ opacity: 0 }}
                />

                {/* Track Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <p className="text-base font-bold text-text truncate animate-slide-in" style={{ opacity: 0 }}>
                    {track.name}
                  </p>
                  <p className="text-sm text-subtext0 truncate animate-slide-in" style={{ opacity: 0, animationDelay: "60ms" }}>
                    {track.artist}
                  </p>
                  <div className="flex items-center gap-3 animate-slide-in" style={{ opacity: 0, animationDelay: "120ms" }}>
                    <p className="text-xs text-overlay0 truncate">{track.album}</p>
                    <span className="text-overlay0/40">·</span>
                    <p className="text-xs text-overlay0 flex-shrink-0">{track.duration}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  {state === "ready" && "download mp3"}
                </button>
                <button
                  onClick={handleReset}
                  className="btn-press px-5 py-3.5 text-xs text-overlay0 hover:text-text hover:bg-surface0/20 border-l border-surface0/60 transition-all duration-200 uppercase tracking-wider"
                >
                  new
                </button>
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          {state === "idle" && (
            <div className="animate-fade-in-up flex items-center gap-2 text-xs text-overlay0/40" style={{ opacity: 0, animationDelay: "300ms" }}>
              <kbd className="px-1.5 py-0.5 rounded border border-surface0/60 text-overlay0/50 text-[10px]">Enter</kbd>
              <span>to download</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>spot.dl</span>
        <span>metadata included</span>
      </footer>
    </div>
  );
}
