# Spotify Downloader — Design Document

## Overview
A minimalist web app for downloading Spotify tracks with full metadata (album art, song name, artist). User pastes a Spotify share link, sees track info, clicks download, gets an MP3.

## Tech Stack
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: Next.js API routes calling `spotdl` CLI
- **Hosting**: Railway (Docker container)
- **Dependencies**: spotdl, yt-dlp, ffmpeg (system-level, installed in Docker)

## Visual Design
- **Palette**: Catppuccin Mocha
  - Base: #1e1e2e, Mantle: #181825, Crust: #11111b
  - Surface0: #313244, Surface1: #45475a, Surface2: #585b70
  - Text: #cdd6f4, Subtext: #a6adc8
  - Lavender: #b4befe, Green: #a6e3a1, Peach: #fab387, Red: #f38ba8
- **Typography**: JetBrains Mono, monospace
- **Layout**: Centered single-column, generous whitespace, subtle 1px border grid lines
- **Style**: Developer-tool aesthetic — no gradients, no glow, clean structured lines

## Page States
1. **Idle**: Logo + title, single input field with paste button, subtle tagline
2. **Fetching**: Loading spinner in input area, Spotify API fetches metadata
3. **Ready**: Card with album art, track name, artist, album. Download button.
4. **Downloading**: Thin lavender progress bar, download streams to user

## Architecture

### API Routes
- `POST /api/metadata` — Spotify URL → Spotify Web API → track info JSON
- `POST /api/download` — Spotify URL → spotdl → stream MP3 back to client

### Flow
```
Paste link → /api/metadata → Show track card → Click download → /api/download → Stream MP3
```

### Spotify API
- Client Credentials flow (no user auth needed)
- Extract track ID from share URL
- Fetch track name, artist, album, album art URL

### Download Pipeline
- spotdl handles: finding match on YouTube, downloading, converting to MP3, embedding metadata + album art
- Temporary files cleaned up after streaming to client

## Deployment
- Dockerfile with Node.js + Python + ffmpeg + spotdl
- Railway deployment via git push
- Environment variables: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
