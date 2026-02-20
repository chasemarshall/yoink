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
  const [progress, setProgress] = useState(0);

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
    setProgress(0);

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
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-text">
              spotify<span className="text-lavender">dl</span>
            </h1>
            <p className="text-sm text-subtext0">
              paste a spotify link. get the mp3. metadata included.
            </p>
          </div>

          {/* Input */}
          <SpotifyInput
            onSubmit={handleSubmit}
            disabled={state === "fetching" || state === "downloading"}
          />

          {/* Loading */}
          {state === "fetching" && (
            <div className="border border-surface0 rounded-lg p-6 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-lavender animate-pulse" />
              <span className="text-sm text-subtext0">fetching track info...</span>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="border border-red/30 rounded-lg p-6 space-y-3">
              <p className="text-sm text-red">{error}</p>
              <button
                onClick={handleReset}
                className="text-xs text-subtext0 hover:text-text transition-colors uppercase tracking-wider"
              >
                try again
              </button>
            </div>
          )}

          {/* Track Card */}
          {track && (state === "ready" || state === "downloading" || state === "done") && (
            <div className="border border-surface0 rounded-lg overflow-hidden">
              {/* Downloading progress bar */}
              {state === "downloading" && (
                <div className="h-0.5 bg-surface0">
                  <div className="h-full bg-lavender animate-pulse w-full" />
                </div>
              )}

              {/* Done bar */}
              {state === "done" && (
                <div className="h-0.5 bg-green" />
              )}

              <div className="p-6 flex gap-5">
                {/* Album Art */}
                <img
                  src={track.albumArt}
                  alt={track.album}
                  className="w-24 h-24 rounded-md object-cover flex-shrink-0"
                />

                {/* Track Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-base font-bold text-text truncate">
                    {track.name}
                  </p>
                  <p className="text-sm text-subtext0 truncate">{track.artist}</p>
                  <p className="text-xs text-overlay0 truncate">{track.album}</p>
                  <p className="text-xs text-overlay0">{track.duration}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-surface0 flex">
                <button
                  onClick={handleDownload}
                  disabled={state === "downloading"}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 hover:bg-surface0"
                  style={{
                    color: state === "done" ? "var(--color-green)" : "var(--color-lavender)",
                  }}
                >
                  {state === "downloading"
                    ? "downloading..."
                    : state === "done"
                      ? "downloaded ✓"
                      : "download mp3"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 text-xs text-overlay0 hover:text-text border-l border-surface0 transition-colors uppercase tracking-wider"
                >
                  new
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface0 px-6 py-4 flex items-center justify-between text-xs text-overlay0">
        <span>spotdl — spotify downloader</span>
        <span>metadata included</span>
      </footer>
    </div>
  );
}
