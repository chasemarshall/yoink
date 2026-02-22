# yoink

paste a spotify link. get the file.

**[yoinkify.lol](https://yoinkify.lol)**

## features

- **tracks, playlists, albums, artists** — paste a link, download everything
- **lossless** — flac, alac, or 320kbps mp3
- **full metadata** — id3v2/vorbis tags, album art, lyrics, genre, explicit flags
- **cross-platform links** — apple music and youtube links resolved automatically
- **search** — type a song name instead of pasting a link
- **no accounts** — no sign-up, no data stored

## stack

- [Next.js](https://nextjs.org) 16 (app router)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) for metadata
- [Piped API](https://github.com/TeamPiped/Piped) for youtube audio
- [ffmpeg](https://ffmpeg.org) for conversion and metadata embedding
- [lrclib](https://lrclib.net) for lyrics
- deployed on [Railway](https://railway.app)

## setup

```bash
git clone https://github.com/chasemarshall/yoink.git
cd yoink
npm install
```

copy `.env.example` to `.env.local` and fill in your credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
PIPED_API_URL=https://pipedapi.kavin.rocks
```

you'll also need [ffmpeg](https://ffmpeg.org/download.html) installed locally.

```bash
npm run dev
```

### optional env vars

| Variable | Description |
|----------|-------------|
| `SPOTIFY_CLIENT_ID` | required — spotify api credentials |
| `SPOTIFY_CLIENT_SECRET` | required — spotify api credentials |
| `PIPED_API_URL` | piped instance for youtube audio |
| `SONGLINK_ENABLED` | enable odesli/songlink for cross-platform link resolution |
| `DEEZER_ARL` | optional — deezer session cookie for lossless audio |
| `TIDAL_CLIENT_ID` | optional — tidal api credentials |
| `TIDAL_CLIENT_SECRET` | optional — tidal api credentials |
| `TIDAL_ACCESS_TOKEN` | optional — tidal access token |
| `TIDAL_REFRESH_TOKEN` | optional — tidal refresh token |
| `ACOUSTID_API_KEY` | optional — acoustid fingerprinting |
| `MUSIXMATCH_TOKEN` | optional — musixmatch lyrics fallback |

## deployment (railway)

set these environment variables in your railway service:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `PIPED_API_URL`
- `RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg`
- `HOSTNAME=0.0.0.0`

## license

mit
