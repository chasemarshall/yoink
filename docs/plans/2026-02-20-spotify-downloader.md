# Spotify Downloader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimalist Spotify track downloader web app with Catppuccin Mocha styling and monospace typography.

**Architecture:** Next.js App Router with two API routes — one for Spotify metadata lookup, one for spotdl-based download+stream. Single-page frontend with idle/fetching/ready/downloading states. Dockerized for Railway deployment.

**Tech Stack:** Next.js 15, Tailwind CSS 4, JetBrains Mono font, Spotify Web API, spotdl CLI, Docker

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install JetBrains Mono font**

Run:
```bash
npm install @fontsource/jetbrains-mono
```

**Step 3: Set up Catppuccin colors in globals.css**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";
@import "@fontsource/jetbrains-mono/700.css";

@theme {
  --color-base: #1e1e2e;
  --color-mantle: #181825;
  --color-crust: #11111b;
  --color-surface0: #313244;
  --color-surface1: #45475a;
  --color-surface2: #585b70;
  --color-overlay0: #6c7086;
  --color-overlay1: #7f849c;
  --color-text: #cdd6f4;
  --color-subtext0: #a6adc8;
  --color-subtext1: #bac2de;
  --color-lavender: #b4befe;
  --color-green: #a6e3a1;
  --color-peach: #fab387;
  --color-red: #f38ba8;
  --color-mauve: #cba6f7;

  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-mono);
  background-color: var(--color-base);
  color: var(--color-text);
}

::selection {
  background-color: var(--color-lavender);
  color: var(--color-crust);
}
```

**Step 4: Set up layout.tsx**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spotdl — Spotify Downloader",
  description: "Download Spotify tracks with full metadata",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
```

**Step 5: Verify it runs**

Run: `npm run dev`
Expected: App loads at localhost:3000 with dark background

**Step 6: Commit**

```bash
git init && git add -A && git commit -m "feat: scaffold Next.js project with Catppuccin Mocha theme"
```

---

### Task 2: Build the Main Page UI (Idle State)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/SpotifyInput.tsx`
- Create: `src/components/Header.tsx`

**Step 1: Create Header component**

`src/components/Header.tsx`:
```tsx
export default function Header() {
  return (
    <header className="border-b border-surface0 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green" />
        <span className="text-sm font-bold tracking-wider uppercase text-text">
          spotdl
        </span>
      </div>
      <span className="text-xs text-overlay0">v1.0</span>
    </header>
  );
}
```

**Step 2: Create SpotifyInput component**

`src/components/SpotifyInput.tsx`:
```tsx
"use client";

import { useState } from "react";

interface SpotifyInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export default function SpotifyInput({ onSubmit, disabled }: SpotifyInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (text.includes("spotify.com")) onSubmit(text.trim());
    } catch {
      // Clipboard access denied — user can type manually
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="border border-surface0 rounded-lg flex items-center overflow-hidden transition-colors focus-within:border-lavender">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          placeholder="https://open.spotify.com/track/..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-text placeholder:text-overlay0 outline-none font-mono disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handlePaste}
          disabled={disabled}
          className="px-4 py-3 text-xs text-subtext0 hover:text-lavender border-l border-surface0 transition-colors uppercase tracking-wider disabled:opacity-50"
        >
          Paste
        </button>
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="px-4 py-3 text-xs text-crust bg-lavender hover:bg-mauve border-l border-surface0 transition-colors uppercase tracking-wider font-bold disabled:opacity-50 disabled:bg-surface1 disabled:text-overlay0"
        >
          Go
        </button>
      </div>
    </form>
  );
}
```

**Step 3: Build the main page**

`src/app/page.tsx`:
```tsx
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
```

**Step 4: Verify the UI renders**

Run: `npm run dev`
Expected: Clean dark page with centered input, monospace text, Catppuccin colors

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: build main page UI with idle/fetching/ready/download states"
```

---

### Task 3: Spotify Metadata API Route

**Files:**
- Create: `src/app/api/metadata/route.ts`
- Create: `src/lib/spotify.ts`
- Create: `.env.local` (gitignored)

**Step 1: Create Spotify API helper**

`src/lib/spotify.ts`:
```ts
interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get Spotify access token");

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

export function extractTrackId(url: string): string | null {
  // Handles: https://open.spotify.com/track/ID?si=...
  // And: spotify:track:ID
  const match = url.match(/track[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function getTrackInfo(url: string) {
  const trackId = extractTrackId(url);
  if (!trackId) throw new Error("Invalid Spotify track URL");

  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Track not found");

  const data = await res.json();

  return {
    name: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
    album: data.album.name,
    albumArt: data.album.images[0]?.url || "",
    duration: formatDuration(data.duration_ms),
    spotifyUrl: data.external_urls.spotify,
  };
}
```

**Step 2: Create the API route**

`src/app/api/metadata/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getTrackInfo } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json({ error: "Please provide a valid Spotify track URL" }, { status: 400 });
    }

    const track = await getTrackInfo(url);
    return NextResponse.json(track);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch track info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 3: Create .env.local**

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Step 4: Add .env.local to .gitignore**

Verify `.env.local` is already in `.gitignore` (Next.js adds it by default).

**Step 5: Test manually**

Once you add real Spotify credentials, test with curl:
```bash
curl -X POST http://localhost:3000/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}'
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Spotify metadata API route with client credentials auth"
```

---

### Task 4: Download API Route (spotdl)

**Files:**
- Create: `src/app/api/download/route.ts`

**Step 1: Create the download route**

`src/app/api/download/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";

const execAsync = promisify(exec);

export const maxDuration = 120; // Railway supports long-running requests

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("spotify.com/track") && !url.includes("spotify:track:")) {
      return NextResponse.json({ error: "Invalid Spotify track URL" }, { status: 400 });
    }

    // Create a temporary directory for the download
    tempDir = await mkdtemp(join(tmpdir(), "spotdl-"));

    // Run spotdl to download the track
    const { stderr } = await execAsync(
      `spotdl download "${url}" --output "${tempDir}"`,
      { timeout: 120000 }
    );

    // Find the downloaded file
    const files = await readdir(tempDir);
    const mp3File = files.find((f) => f.endsWith(".mp3"));

    if (!mp3File) {
      console.error("spotdl stderr:", stderr);
      throw new Error("Download failed — no MP3 file produced");
    }

    const filePath = join(tempDir, mp3File);
    const fileBuffer = await readFile(filePath);

    // Clean up
    await unlink(filePath).catch(() => {});

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(mp3File)}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up temp directory
    if (tempDir) {
      const { readdir, unlink, rmdir } = await import("fs/promises");
      try {
        const files = await readdir(tempDir);
        await Promise.all(files.map((f) => unlink(join(tempDir!, f))));
        await rmdir(tempDir);
      } catch {
        // Best effort cleanup
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add download API route using spotdl"
```

---

### Task 5: Dockerfile for Railway

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Step 1: Create .dockerignore**

```
node_modules
.next
.git
.env.local
docs
```

**Step 2: Create Dockerfile**

```dockerfile
FROM node:20-slim AS base

# Install Python, ffmpeg, and spotdl
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/spotdl-venv && \
    /opt/spotdl-venv/bin/pip install spotdl

ENV PATH="/opt/spotdl-venv/bin:$PATH"

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Dockerfile for Railway deployment"
```

---

### Task 6: Final Polish + README

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example**

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

**Step 2: Final test**

Run: `npm run build && npm start`
Expected: App builds and serves correctly on localhost:3000

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add env example, final polish"
```
