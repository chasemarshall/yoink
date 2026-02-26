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

## audio sources

yoink supports multiple audio sources and will try to find the best available quality. configure additional sources via env vars for higher quality output.

## stack

- [Next.js](https://nextjs.org) 16 (app router)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) for metadata
- [Piped API](https://github.com/TeamPiped/Piped) for youtube audio
- [ffmpeg](https://ffmpeg.org) for conversion and metadata embedding
- [lrclib](https://lrclib.net) for lyrics

## self-hosting

### docker (recommended)

```bash
git clone https://github.com/chasemarshall/yoink.git
cd yoink
cp .env.example .env
# fill in your env vars
docker compose up -d
```

yoink will be running on `http://localhost:3000`.

### local dev

```bash
git clone https://github.com/chasemarshall/yoink.git
cd yoink
npm install
cp .env.example .env.local
# fill in your env vars
npm run dev
```

you'll need [ffmpeg](https://ffmpeg.org/download.html) installed locally.

### env vars

**required:**

| variable | description |
|---|---|
| `SPOTIFY_CLIENT_ID` | spotify app client id ([create one here](https://developer.spotify.com/dashboard)) |
| `SPOTIFY_CLIENT_SECRET` | spotify app client secret |

**optional:**

| variable | description |
|---|---|
| `PIPED_API_URL` | piped instance url (default: `pipedapi.kavin.rocks`) |
| `TIDAL_CLIENT_ID` | tidal app client id |
| `TIDAL_CLIENT_SECRET` | tidal app client secret |
| `TIDAL_ACCESS_TOKEN` | tidal access token |
| `TIDAL_REFRESH_TOKEN` | tidal refresh token |
| `ACOUSTID_API_KEY` | audio fingerprinting |
| `MUSIXMATCH_TOKEN` | lyrics fallback |
| `SONGLINK_ENABLED` | enable cross-platform link resolution (`true`/`false`) |

## attribution

if you fork or self-host yoink, a "powered by [yoink](https://yoinkify.lol)" mention is appreciated but not required.

## license

[AGPL-3.0](LICENSE)
