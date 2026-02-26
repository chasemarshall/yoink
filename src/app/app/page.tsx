"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
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
  videoCover?: string;
  previewUrl?: string | null;
}

interface PlaylistInfo {
  name: string;
  image: string;
  tracks: TrackInfo[];
}

type TrackStatus = "pending" | "downloading" | "done" | "error";

interface QualityInfo {
  source: string;
  quality: string;
  codec: string;
  actualBitrate: number;
  sampleRate: number;
  bitDepth: number | null;
  format: string;
}

type AppState = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [trackStatuses, setTrackStatuses] = useState<TrackStatus[]>([]);
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [quality, setQuality] = useState<QualityInfo | null>(null);
  const [format, setFormat] = useState<Format>("mp3");
  const [genreSource, setGenreSource] = useState<"spotify" | "itunes">("spotify");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const abortRef = useRef(false);
  const downloadTriggeredRef = useRef(false);
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
    setIsRateLimited(false);
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
        if (data.rateLimit) setIsRateLimited(true);
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
        if (data.rateLimit) setIsRateLimited(true);
        throw new Error(data.error || "Download failed");
      }

      const audioSource = res.headers.get("X-Audio-Source") || "youtube";
      const audioQuality = res.headers.get("X-Audio-Quality") || "~160";
      const audioFormat = res.headers.get("X-Audio-Format") || "mp3";
      const audioCodec = res.headers.get("X-Audio-Codec") || "";
      const actualBitrate = parseInt(res.headers.get("X-Audio-Actual-Bitrate") || "0", 10);
      const sampleRate = parseInt(res.headers.get("X-Audio-Sample-Rate") || "0", 10);
      const bitDepthRaw = res.headers.get("X-Audio-Bit-Depth");
      const bitDepth = bitDepthRaw ? parseInt(bitDepthRaw, 10) : null;

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
      return {
        source: audioSource,
        quality: audioQuality,
        codec: audioCodec,
        actualBitrate,
        sampleRate,
        bitDepth,
        format: audioFormat,
      };
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
    audioRef.current?.pause();
    setPreviewPlaying(null);
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
          {/* Status notice */}
          {!bannerDismissed && (
            <div
              className="animate-fade-in-up flex items-start gap-3 border border-peach/15 rounded-lg px-4 py-3.5 bg-peach/[0.03]"
              style={{ opacity: 0 }}
            >
              <div className="w-1 self-stretch rounded-full bg-peach/30 shrink-0" />
              <p className="text-xs text-subtext0/70 leading-relaxed flex-1">
                hey — we&apos;ve been hitting spotify api limits today. downloads still work but might be a bit slower while we pull from backup sources. sorry about that, working on it.
              </p>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-overlay0/30 hover:text-overlay0/60 transition-colors shrink-0 mt-px"
                aria-label="dismiss"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          )}

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
              tracks, playlists, albums. metadata included.
            </p>
          </div>

          {/* Input + Format Toggle */}
          <div className="space-y-3">
            <SpotifyInput
              onSubmit={handleSubmit}
              disabled={state === "fetching" || state === "downloading"}
              clear={state === "done"}
            />
            <div className="flex items-center justify-between flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
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
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="btn-press text-xs text-subtext0 hover:text-text transition-colors uppercase tracking-wider"
                >
                  try again
                </button>
                <a
                  href="mailto:me@yoinkify.lol"
                  className="text-xs text-overlay0/50 hover:text-overlay0 transition-colors"
                >
                  me@yoinkify.lol
                </a>
              </div>
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

              <div className="p-4 sm:p-6 flex gap-4 sm:gap-5 stagger">
                <button
                  className="w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] flex-shrink-0 relative group"
                  onClick={() => track.previewUrl && togglePreview(track.previewUrl)}
                  disabled={!track.previewUrl}
                  title={track.previewUrl ? "preview" : "no preview available"}
                >
                  {track.videoCover ? (
                    <video
                      src={track.videoCover}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="art-glow w-full h-full rounded-lg object-cover animate-fade-in"
                      style={{ opacity: 0 }}
                      poster={track.albumArt}
                    />
                  ) : (
                    <img
                      src={track.albumArt}
                      alt={track.album}
                      className="art-glow w-full h-full rounded-lg object-cover animate-fade-in"
                      style={{ opacity: 0 }}
                    />
                  )}
                  {track.previewUrl && (
                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        {previewPlaying === track.previewUrl ? (
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
                      {quality.quality === "lossless"
                        ? `lossless ${quality.format} ${quality.bitDepth || 16}-bit/${quality.sampleRate ? `${(quality.sampleRate / 1000).toFixed(1)}kHz` : "44.1kHz"}`
                        : quality.actualBitrate > 0
                          ? `${Math.round(quality.actualBitrate / 1000)}kbps ${quality.format}`
                          : `${quality.quality}kbps ${quality.format}`
                      }
                      {" · "}{quality.source}
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
              <div className="p-4 sm:p-6 flex gap-4 sm:gap-5">
                {playlist.image && (
                  <img
                    src={playlist.image}
                    alt={playlist.name}
                    className="art-glow w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] rounded-lg object-cover flex-shrink-0 animate-fade-in"
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
                    className={`flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-surface0/20 last:border-b-0 transition-colors duration-200 ${
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

                    {/* Preview + Duration */}
                    {t.previewUrl && (
                      <button
                        onClick={() => togglePreview(t.previewUrl!)}
                        className="flex-shrink-0 p-1 text-overlay0/40 hover:text-lavender transition-colors"
                        title="preview"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          {previewPlaying === t.previewUrl ? (
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </button>
                    )}
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
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/how" className="text-mauve/60 hover:text-mauve transition-colors duration-200">local files</Link>
          <Link href="/players" className="text-green/60 hover:text-green transition-colors duration-200">players</Link>
          <Link href="/roadmap" className="hover:text-text transition-colors duration-200">roadmap</Link>
          <a href="https://bsky.app/profile/yoinkify.lol" target="_blank" rel="noopener noreferrer" className="hover:text-sky transition-colors duration-200">bluesky</a>
          <a href="https://chasefrazier.dev/tip" target="_blank" rel="noopener noreferrer" className="hover:text-peach transition-colors duration-200">tip jar</a>
        </div>
      </footer>
    </div>
  );
}
