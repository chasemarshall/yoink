# yoink

spotify downloader. paste a link, get the mp3.

**[yoink.chasefrazier.dev](https://yoink.chasefrazier.dev)**

## features

- **tracks & playlists** — paste a spotify link, download as 192kbps mp3
- **full metadata** — id3v2 tags, album art, and lyrics embedded via ffmpeg
- **no accounts** — no sign-up, no data stored, nothing logged
- **local files guide** — instructions for importing downloads back into spotify ad-free

## stack

- [Next.js](https://nextjs.org) 16 (app router)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) for metadata
- [Piped API](https://github.com/TeamPiped/Piped) for audio
- [ffmpeg](https://ffmpeg.org) for conversion and metadata embedding
- [lrclib](https://lrclib.net) for lyrics
- deployed on [Railway](https://railway.app)

## setup

```bash
git clone https://github.com/chasemarshall/downloader.git
cd downloader
npm install
```

copy `.env.example` to `.env.local` and fill in your spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
PIPED_API_URL=https://pipedapi.withmilo.xyz
```

you'll also need [ffmpeg](https://ffmpeg.org/download.html) installed locally.

```bash
npm run dev
```

## deployment (railway)

set these environment variables in your railway service:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `PIPED_API_URL`
- `RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg`
- `HOSTNAME=0.0.0.0`

## license

mit
