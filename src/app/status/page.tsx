"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface StatusCheck {
  name: string;
  ok: boolean;
}

interface StatusData {
  status: "operational" | "degraded";
  checks: StatusCheck[];
  audioSources: {
    deezer: boolean;
    tidal: boolean;
    youtube: boolean;
  };
  spotifyRateLimited: boolean;
  latency: number;
  timestamp: string;
}

const serviceLabels: Record<string, { label: string; description: string }> = {
  spotify: {
    label: "spotify api",
    description: "metadata, search, link resolution",
  },
  ffmpeg: {
    label: "ffmpeg",
    description: "audio conversion & tagging",
  },
  lrclib: {
    label: "lrclib",
    description: "lyrics fetching",
  },
  itunes: {
    label: "itunes api",
    description: "genre lookup & catalog matching",
  },
};

const sourceLabels: Record<string, { label: string; description: string }> = {
  deezer: {
    label: "deezer",
    description: "lossless audio source",
  },
  tidal: {
    label: "tidal",
    description: "hi-res audio source",
  },
  youtube: {
    label: "youtube",
    description: "fallback audio source",
  },
};

function StatusDot({ ok, pulse, warn }: { ok: boolean; pulse?: boolean; warn?: boolean }) {
  const color = ok
    ? "bg-green shadow-[0_0_6px_rgba(166,227,161,0.4)]"
    : warn
      ? "bg-peach shadow-[0_0_6px_rgba(250,179,135,0.4)]"
      : "bg-red shadow-[0_0_6px_rgba(243,139,168,0.4)]";
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {pulse && ok && (
        <div className="absolute w-3 h-3 rounded-full bg-green/40 animate-ping" />
      )}
      <div className={`relative w-2 h-2 rounded-full ${color}`} />
    </div>
  );
}

function ConfigDot({ configured }: { configured: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <div
        className={`relative w-2 h-2 rounded-full ${
          configured
            ? "bg-green shadow-[0_0_6px_rgba(166,227,161,0.4)]"
            : "bg-surface2"
        }`}
      />
    </div>
  );
}

function TimeAgo({ timestamp }: { timestamp: string }) {
  const [ago, setAgo] = useState("");

  useEffect(() => {
    function update() {
      const seconds = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 1000
      );
      if (seconds < 5) setAgo("just now");
      else if (seconds < 60) setAgo(`${seconds}s ago`);
      else setAgo(`${Math.floor(seconds / 60)}m ago`);
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [timestamp]);

  return <>{ago}</>;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const operational = data?.status === "operational";

  return (
    <div className="min-h-screen bg-grid">
      {/* Nav */}
      <nav className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/status" className="status-dot w-2 h-2 rounded-full bg-green hover:shadow-[0_0_8px_rgba(166,227,161,0.6)] transition-shadow" />
          <Link href="/" className="text-sm font-bold tracking-wider uppercase text-text hover:text-lavender transition-colors">
            yoink
          </Link>
        </div>
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
            system status
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight text-text">
            how&apos;s
            <br />
            <span className="text-lavender">yoink doing.</span>
          </h1>
          <p className="text-lg text-subtext0/80 leading-relaxed max-w-md">
            live service health. auto-refreshes every 30 seconds.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-surface0/40" />
      </div>

      {/* Overall status banner */}
      <section className="px-6 py-12 max-w-2xl mx-auto">
        <div
          className="animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "80ms" }}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-surface2 animate-pulse" />
              <span className="text-sm text-overlay0">checking services...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red" />
              <span className="text-sm text-red font-bold">
                unable to reach status api
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-3 h-3">
                {operational && (
                  <div className="absolute w-3 h-3 rounded-full bg-green/40 animate-ping" />
                )}
                <div
                  className={`relative w-2.5 h-2.5 rounded-full ${
                    operational ? "bg-green" : "bg-peach"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  operational ? "text-green" : "text-peach"
                }`}
              >
                {operational ? "all systems operational" : "degraded performance"}
              </span>
              {data && (
                <span className="text-xs text-surface2 ml-1">
                  · <TimeAgo timestamp={data.timestamp} />
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {data && !error && (
        <>
          {/* Spotify rate limit notice */}
          {data.spotifyRateLimited && (
            <>
              <div className="max-w-2xl mx-auto px-6">
                <div className="border-t border-surface0/40" />
              </div>
              <section className="px-6 py-8 max-w-2xl mx-auto">
                <div
                  className="animate-fade-in-up border border-peach/20 rounded-lg p-5 bg-peach/5"
                  style={{ opacity: 0, animationDelay: "120ms" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-peach mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-peach">
                        spotify rate limited
                      </p>
                      <p className="text-xs text-subtext0/80 leading-relaxed">
                        metadata is temporarily being pulled from backup sources
                        (deezer, itunes). downloads still work — just using
                        alternate metadata while spotify cools down.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Services */}
          <div className="max-w-2xl mx-auto px-6">
            <div className="border-t border-surface0/40" />
          </div>
          <section className="px-6 py-16 max-w-2xl mx-auto">
            <div className="space-y-10">
              <div
                className="animate-fade-in-up flex items-center gap-3"
                style={{ opacity: 0, animationDelay: "140ms" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-lavender" />
                <p className="text-xs text-lavender uppercase tracking-[0.3em] font-bold">
                  services
                </p>
              </div>

              <div className="space-y-1">
                {data.checks.map((check, i) => {
                  const info = serviceLabels[check.name];
                  if (!info) return null;
                  return (
                    <div
                      key={check.name}
                      className="animate-fade-in-up flex items-center justify-between py-4 group"
                      style={{
                        opacity: 0,
                        animationDelay: `${180 + i * 60}ms`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <StatusDot ok={check.ok} pulse={check.ok} warn={!check.ok && check.name === "spotify" && data.spotifyRateLimited} />
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-text">
                            {info.label}
                          </p>
                          <p className="text-xs text-overlay0">
                            {info.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          check.ok
                            ? "text-green/80 bg-green/10"
                            : check.name === "spotify" && data.spotifyRateLimited
                              ? "text-peach/80 bg-peach/10"
                              : "text-red/80 bg-red/10"
                        }`}
                      >
                        {check.ok
                          ? "ok"
                          : check.name === "spotify" && data.spotifyRateLimited
                            ? "limited"
                            : "down"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Audio sources */}
          <div className="max-w-2xl mx-auto px-6">
            <div className="border-t border-surface0/40" />
          </div>
          <section className="px-6 py-16 max-w-2xl mx-auto">
            <div className="space-y-10">
              <div
                className="animate-fade-in-up flex items-center gap-3"
                style={{ opacity: 0, animationDelay: "400ms" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-mauve" />
                <p className="text-xs text-mauve uppercase tracking-[0.3em] font-bold">
                  audio sources
                </p>
              </div>

              <div className="space-y-1">
                {Object.entries(data.audioSources).map(
                  ([key, configured], i) => {
                    const info = sourceLabels[key];
                    if (!info) return null;
                    return (
                      <div
                        key={key}
                        className="animate-fade-in-up flex items-center justify-between py-4 group"
                        style={{
                          opacity: 0,
                          animationDelay: `${440 + i * 60}ms`,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <ConfigDot configured={configured} />
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-text">
                              {info.label}
                            </p>
                            <p className="text-xs text-overlay0">
                              {info.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            configured
                              ? "text-green/80 bg-green/10"
                              : "text-surface2 bg-surface0/40"
                          }`}
                        >
                          {configured ? "active" : "not configured"}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* Response time */}
          <div className="max-w-2xl mx-auto px-6">
            <div className="border-t border-surface0/40" />
          </div>
          <section className="px-6 py-12 max-w-2xl mx-auto">
            <div
              className="animate-fade-in-up flex items-center gap-6 text-xs text-overlay0"
              style={{ opacity: 0, animationDelay: "600ms" }}
            >
              <span>
                response time:{" "}
                <span className="text-text font-bold">{data.latency}ms</span>
              </span>
              <span>
                checked:{" "}
                <span className="text-text font-bold">
                  <TimeAgo timestamp={data.timestamp} />
                </span>
              </span>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-surface0/40 px-6 py-4 flex items-center justify-between text-xs text-overlay0/50">
        <span>yoink</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/how"
            className="text-mauve/60 hover:text-mauve transition-colors duration-200"
          >
            local files
          </Link>
          <Link
            href="/players"
            className="text-green/60 hover:text-green transition-colors duration-200"
          >
            players
          </Link>
          <Link
            href="/roadmap"
            className="hover:text-text transition-colors duration-200"
          >
            roadmap
          </Link>
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
