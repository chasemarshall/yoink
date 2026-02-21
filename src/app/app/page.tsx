"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import SpotifyInput from "@/components/SpotifyInput";

interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: string;
  spotifyUrl: string;
  previewUrl: string | null;
}

interface PlaylistInfo {
  name: string;
  image: string;
  tracks: TrackInfo[];
}

type TrackStatus = "pending" | "downloading" | "done" | "error";

type AppState = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

function PreviewButton({ previewUrl }: { previewUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggle = () => {
    if (!previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime / audioRef.current.duration);
        }
      });
      audioRef.current.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!previewUrl) return null;

  return (
    <button
      onClick={toggle}
      className="absolute inset-0 flex items-center justify-center bg-crust/0 hover:bg-crust/60 transition-all duration-200 rounded-lg group"
      title="preview 30s"
    >
      {/* Progress ring */}
      {playing && (
        <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="var(--color-lavender)"
            strokeWidth="2"
            strokeDasharray={`${progress * 289} 289`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-200"
            transform="rotate(-90 50 50)"
            opacity="0.6"
          />
        </svg>
      )}
      {/* Play/pause icon */}
      <span className={`text-lg transition-opacity duration-200 ${playing ? "opacity-80" : "opacity-0 group-hover:opacity-80"}`}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-lavender)">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-lavender)">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        )}
      </span>
    </button>
  );
}

function PlaylistPreviewButton({ previewUrl, playing: isPlaying, onToggle }: { previewUrl: string | null; playing: boolean; onToggle: () => void }) {
  if (!previewUrl) return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface0/40 transition-colors duration-150"
      title="preview"
    >
      {isPlaying ? (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-lavender)">
          <rect x="3" y="2" width="4" height="12" rx="1" />
          <rect x="9" y="2" width="4" height="12" rx="1" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-overlay1)">
          <path d="M4 2.5v11l9-5.5z" />
        </svg>
      )}
    </button>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [trackStatuses, setTrackStatuses] = useState<TrackStatus[]>([]);
  const [error, setError] = useState("");
  const abortRef = useRef(false);
  const playlistAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const stopPlaylistPreview = useCallback(() => {
    if (playlistAudioRef.current) {
      playlistAudioRef.current.pause();
      playlistAudioRef.current = null;
    }
    setPlayingIndex(null);
  }, []);

  const togglePlaylistPreview = useCallback((index: number, previewUrl: string) => {
    if (playingIndex === index) {
      stopPlaylistPreview();
      return;
    }

    if (playlistAudioRef.current) {
      playlistAudioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.addEventListener("ended", () => {
      setPlayingIndex(null);
      playlistAudioRef.current = null;
    });
    audio.play();
    playlistAudioRef.current = audio;
    setPlayingIndex(index);
  }, [playingIndex, stopPlaylistPreview]);

  const handleSubmit = async (url: string) => {
    setState("fetching");
    setError("");
    setTrack(null);
    setPlaylist(null);
    setTrackStatuses([]);
    abortRef.current = false;
    stopPlaylistPreview();

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch info");
      }

      const data = await res.json();

      if (data.type === "playlist") {
        setPlaylist({ name: data.name, image: data.image, tracks: data.tracks });
        setTrackStatuses(new Array(data.tracks.length).fill("pending"));
      } else {
        setTrack(data);
      }
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const downloadTrack = useCallback(async (trackInfo: TrackInfo): Promise<boolean> => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trackInfo.spotifyUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Download failed");
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${trackInfo.artist} - ${trackInfo.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleDownload = async () => {
    if (!track) return;
    setState("downloading");

    const success = await downloadTrack(track);
    if (success) {
      setState("done");
      setTimeout(() => setState("ready"), 3000);
    } else {
      setError("Download failed");
      setState("error");
    }
  };

  const handleDownloadAll = async () => {
    if (!playlist) return;
    setState("downloading");
    abortRef.current = false;
    stopPlaylistPreview();

    for (let i = 0; i < playlist.tracks.length; i++) {
      if (abortRef.current) break;

      setTrackStatuses((prev) => {
        const next = [...prev];
        next[i] = "downloading";
        return next;
      });

      const success = await downloadTrack(playlist.tracks[i]);

      setTrackStatuses((prev) => {
        const next = [...prev];
        next[i] = success ? "done" : "error";
        return next;
      });
    }

    setState("done");
    setTimeout(() => setState("ready"), 3000);
  };

  const handleReset = () => {
    setState("idle");
    setTrack(null);
    setPlaylist(null);
    setTrackStatuses([]);
    setError("");
    abortRef.current = true;
    stopPlaylistPreview();
  };

  const doneCount = trackStatuses.filter((s) => s === "done").length;
  const totalCount = trackStatuses.length;

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* Title */}
          <div className="space-y-3 animate-fade-in-up" style={{ opacity: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              <span className="text-lavender">y</span>
              <span className="logo-expand" style={{ animationDelay: "0.3s" }}>o</span>
              <span className="logo-expand" style={{ animationDelay: "0.4s" }}>i</span>
              <span className="logo-expand" style={{ animationDelay: "0.5s" }}>n</span>
              <span className="text-lavender">k</span>
            </h1>
            <p className="text-sm text-subtext0/80 leading-relaxed max-w-sm">
              paste a spotify link. get the mp3.<br />
              tracks and playlists. metadata included.
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
              <span className="text-sm text-subtext0">fetching info</span>
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

          {/* Single Track Card */}
          {track && (state === "ready" || state === "downloading" || state === "done") && (
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

              <div className="p-6 flex gap-5 stagger">
                <div className="relative w-[100px] h-[100px] flex-shrink-0">
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="art-glow w-full h-full rounded-lg object-cover animate-fade-in"
                    style={{ opacity: 0 }}
                  />
                  <PreviewButton previewUrl={track.previewUrl} />
                </div>
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

          {/* Playlist Card */}
          {playlist && (state === "ready" || state === "downloading" || state === "done") && (
            <div className="animate-fade-in-up border border-surface0/60 rounded-lg overflow-hidden bg-mantle/40" style={{ opacity: 0 }}>
              {state === "downloading" && (
                <div className="h-1 bg-surface0/40">
                  <div
                    className="h-full bg-lavender transition-all duration-500 ease-out"
                    style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              )}
              {state === "done" && (
                <div className="h-1 bg-surface0/40">
                  <div className="h-full bg-green w-full transition-all duration-300" />
                </div>
              )}
              {state === "ready" && <div className="h-1" />}

              {/* Playlist header */}
              <div className="p-6 flex gap-5">
                {playlist.image && (
                  <img
                    src={playlist.image}
                    alt={playlist.name}
                    className="art-glow w-[100px] h-[100px] rounded-lg object-cover flex-shrink-0 animate-fade-in"
                    style={{ opacity: 0 }}
                  />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <p className="text-base font-bold text-text truncate animate-slide-in" style={{ opacity: 0 }}>
                    {playlist.name}
                  </p>
                  <p className="text-sm text-subtext0 animate-slide-in" style={{ opacity: 0, animationDelay: "60ms" }}>
                    {totalCount} track{totalCount !== 1 && "s"}
                  </p>
                  {state === "downloading" && (
                    <p className="text-xs text-lavender animate-fade-in" style={{ opacity: 0 }}>
                      {doneCount}/{totalCount} downloaded
                    </p>
                  )}
                  {state === "done" && (
                    <p className="text-xs text-green animate-fade-in" style={{ opacity: 0 }}>
                      {doneCount}/{totalCount} downloaded
                    </p>
                  )}
                </div>
              </div>

              {/* Track list */}
              <div className="border-t border-surface0/40 max-h-[320px] overflow-y-auto">
                {playlist.tracks.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-6 py-3 border-b border-surface0/20 last:border-b-0 transition-colors duration-200 ${
                      trackStatuses[i] === "downloading" ? "bg-lavender/5" : playingIndex === i ? "bg-lavender/5" : ""
                    }`}
                  >
                    {/* Status indicator */}
                    <div className="flex-shrink-0 w-5 text-center">
                      {trackStatuses[i] === "pending" && (
                        <span className="text-xs text-overlay0/50">{i + 1}</span>
                      )}
                      {trackStatuses[i] === "downloading" && (
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="loading-dot w-1 h-1 rounded-full bg-lavender" />
                          <div className="loading-dot w-1 h-1 rounded-full bg-lavender" />
                        </div>
                      )}
                      {trackStatuses[i] === "done" && (
                        <span className="text-xs text-green">✓</span>
                      )}
                      {trackStatuses[i] === "error" && (
                        <span className="text-xs text-red">!</span>
                      )}
                    </div>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        trackStatuses[i] === "done" ? "text-subtext0" : "text-text"
                      }`}>
                        {t.name}
                      </p>
                      <p className="text-xs text-overlay0 truncate">{t.artist}</p>
                    </div>

                    {/* Preview button */}
                    {t.previewUrl && (
                      <PlaylistPreviewButton
                        previewUrl={t.previewUrl}
                        playing={playingIndex === i}
                        onToggle={() => togglePlaylistPreview(i, t.previewUrl!)}
                      />
                    )}

                    {/* Duration */}
                    <span className="text-xs text-overlay0/50 flex-shrink-0">{t.duration}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-surface0/60 flex">
                <button
                  onClick={handleDownloadAll}
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
                      {doneCount}/{totalCount}
                    </span>
                  )}
                  {state === "done" && `downloaded ${doneCount}/${totalCount}`}
                  {state === "ready" && "download all"}
                </button>
                <button
                  onClick={handleReset}
                  disabled={state === "downloading"}
                  className="btn-press px-5 py-3.5 text-xs text-overlay0 hover:text-text hover:bg-surface0/20 border-l border-surface0/60 transition-all duration-200 uppercase tracking-wider disabled:opacity-50"
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
