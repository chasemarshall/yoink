"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import SpotifyInput from "@/components/SpotifyInput";
import FormatToggle, { type Format } from "@/components/FormatToggle";

interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: string;
  spotifyUrl: string;
  explicit?: boolean;
}

interface PlaylistInfo {
  name: string;
  image: string;
  tracks: TrackInfo[];
}

type TrackStatus = "pending" | "downloading" | "done" | "error";

interface QualityInfo {
  source: string;
  bitrate: string;
}

type AppState = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [trackStatuses, setTrackStatuses] = useState<TrackStatus[]>([]);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<QualityInfo | null>(null);
  const [format, setFormat] = useState<Format>("mp3");
  const [genreSource, setGenreSource] = useState<"spotify" | "itunes">("spotify");
  const abortRef = useRef(false);
  const downloadTriggeredRef = useRef(false);

  // Enter key triggers download when track/playlist is ready
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (state !== "ready") return;
      if (downloadTriggeredRef.current) return;
      // Don't trigger if focused on the input
      const active = document.activeElement;
      if (active && active.tagName === "INPUT") return;
      downloadTriggeredRef.current = true;
      if (track) handleDownload();
      else if (playlist) handleDownloadAll();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleSubmit = async (url: string) => {
    setState("fetching");
    setError("");
    setTrack(null);
    setPlaylist(null);
    setTrackStatuses([]);
    setOriginalUrl(url);
    abortRef.current = false;
    downloadTriggeredRef.current = false;

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

  const downloadTrack = useCallback(async (trackInfo: TrackInfo): Promise<QualityInfo | false> => {
    try {
      const trackUrl = trackInfo.spotifyUrl || originalUrl;
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trackUrl, format, genreSource }),
      });

      if (!res.ok) {
        const data = await res.json();
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
      a.download = `${trackInfo.artist} - ${trackInfo.name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      return { source: audioSource, bitrate: audioBitrate };
    } catch {
      return false;
    }
  }, [format, genreSource, originalUrl]);

  const handleDownload = async () => {
    if (!track) return;
    setState("downloading");
    setQuality(null);

    const result = await downloadTrack(track);
    if (result) {
      setQuality(result);
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

    // Mark all tracks as pending
    setTrackStatuses(new Array(playlist.tracks.length).fill("pending"));

    try {
      const res = await fetch("/api/download-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: originalUrl, format, genreSource }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Playlist download failed");
      }

      const reader = res.body!.getReader();
      const zipChunks: Uint8Array[] = [];
      let byteBuffer = new Uint8Array(0);
      let zipFilename = `${playlist.name}.zip`;
      let zipStarted = false;

      const handleEvent = (event: { type: string; indices?: number[]; index?: number; error?: string; filename?: string }) => {
        if (event.type === "batch") {
          setTrackStatuses((prev) => {
            const next = [...prev];
            for (const idx of event.indices!) next[idx] = "downloading";
            return next;
          });
        } else if (event.type === "done") {
          setTrackStatuses((prev) => {
            const next = [...prev];
            next[event.index!] = "done";
            return next;
          });
        } else if (event.type === "error") {
          setTrackStatuses((prev) => {
            const next = [...prev];
            next[event.index!] = "error";
            return next;
          });
        } else if (event.type === "fatal") {
          throw new Error(event.error);
        } else if (event.type === "zip") {
          zipFilename = event.filename || zipFilename;
          zipStarted = true;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (zipStarted) {
          zipChunks.push(value);
          continue;
        }

        // Process at byte level to avoid TextDecoder corrupting binary data
        const combined = new Uint8Array(byteBuffer.length + value.length);
        combined.set(byteBuffer);
        combined.set(value, byteBuffer.length);
        byteBuffer = combined;

        // Parse complete lines (newline = 0x0A)
        while (true) {
          const newlineIdx = byteBuffer.indexOf(0x0A);
          if (newlineIdx === -1) break;

          const lineBytes = byteBuffer.slice(0, newlineIdx);
          byteBuffer = byteBuffer.slice(newlineIdx + 1);

          const line = new TextDecoder().decode(lineBytes).trim();
          if (!line) continue;

          try {
            const event = JSON.parse(line);
            handleEvent(event);

            // After zip event, remaining buffer is binary zip data
            if (zipStarted && byteBuffer.length > 0) {
              zipChunks.push(byteBuffer);
              byteBuffer = new Uint8Array(0);
              break;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      // Assemble zip and trigger download
      const totalSize = zipChunks.reduce((sum, c) => sum + c.length, 0);
      const zipArray = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of zipChunks) {
        zipArray.set(chunk, offset);
        offset += chunk.length;
      }
      const zipBlob = new Blob([zipArray], { type: "application/zip" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setState("done");
      setTimeout(() => setState("ready"), 3000);
    } catch (err) {
      setTrackStatuses((prev) => prev.map((s) => s === "downloading" || s === "pending" ? "error" : s));
      setError(err instanceof Error ? err.message : "Playlist download failed");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setTrack(null);
    setPlaylist(null);
    setTrackStatuses([]);
    setError("");
    setQuality(null);
    abortRef.current = true;
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
              paste a spotify link. get the {format}.<br />
              tracks and playlists. metadata included.
            </p>
          </div>

          {/* Input + Format Toggle */}
          <div className="space-y-3">
            <SpotifyInput
              onSubmit={handleSubmit}
              disabled={state === "fetching" || state === "downloading"}
              clear={state === "done"}
            />
            <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
              <FormatToggle
                value={format}
                onChange={setFormat}
                disabled={state === "downloading"}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGenreSource(genreSource === "spotify" ? "itunes" : "spotify")}
                  disabled={state === "downloading"}
                  className={`text-[10px] tracking-wider transition-colors duration-200 disabled:opacity-50 ${
                    genreSource === "itunes" ? "text-lavender/70" : "text-overlay0/30 hover:text-overlay0/50"
                  }`}
                >
                  {genreSource === "itunes" ? "iTunes genres ✓" : "iTunes genres"}
                </button>
                <span className="text-[10px] text-overlay0/30 tracking-wider">
                  {format === "mp3" ? "~8mb per track" : "~40mb per track"}
                </span>
              </div>
            </div>
          </div>

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
                <div className="w-[100px] h-[100px] flex-shrink-0">
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="art-glow w-full h-full rounded-lg object-cover animate-fade-in"
                    style={{ opacity: 0 }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <p className="text-base font-bold text-text truncate animate-slide-in" style={{ opacity: 0 }}>
                    {track.name}
                    {track.explicit && (
                      <span className="inline-flex items-center justify-center ml-1.5 px-1 py-px text-[9px] font-bold leading-none uppercase tracking-wide rounded bg-overlay0/20 text-overlay0 align-middle">E</span>
                    )}
                  </p>
                  <p className="text-sm text-subtext0 truncate animate-slide-in" style={{ opacity: 0, animationDelay: "60ms" }}>
                    {track.artist}
                  </p>
                  <div className="flex items-center gap-3 animate-slide-in" style={{ opacity: 0, animationDelay: "120ms" }}>
                    <p className="text-xs text-overlay0 truncate">{track.album}</p>
                    <span className="text-overlay0/40">·</span>
                    <p className="text-xs text-overlay0 flex-shrink-0">{track.duration}</p>
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
                    <span className="inline-flex items-baseline gap-2">
                      <span>y<span className="logo-pulse" style={{ animationDelay: "0s" }}>o</span><span className="logo-pulse" style={{ animationDelay: "0.1s" }}>i</span><span className="logo-pulse" style={{ animationDelay: "0.2s" }}>n</span>k</span>
                      downloading
                    </span>
                  )}
                  {state === "done" && "downloaded"}
                  {state === "ready" && `download ${format}`}
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
                      trackStatuses[i] === "downloading" ? "bg-lavender/5" : ""
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
                        {t.explicit && (
                          <span className="inline-flex items-center justify-center ml-1 px-0.5 py-px text-[8px] font-bold leading-none uppercase tracking-wide rounded bg-overlay0/20 text-overlay0/70 align-middle">E</span>
                        )}
                      </p>
                      <p className="text-xs text-overlay0 truncate">{t.artist}</p>
                    </div>

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
                    <span className="inline-flex items-baseline gap-2">
                      <span>y<span className="logo-pulse" style={{ animationDelay: "0s" }}>o</span><span className="logo-pulse" style={{ animationDelay: "0.1s" }}>i</span><span className="logo-pulse" style={{ animationDelay: "0.2s" }}>n</span>k</span>
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
