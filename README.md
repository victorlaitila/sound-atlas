# SoundAtlas

Click a country and hear its sound.

SoundAtlas is a Next.js music-preview app powered by a deterministic curated soundtrack dataset and iTunes previews. It has no auth, payments, Wikimedia Commons integration, YouTube embeds, or external players. The frontend can use the deployed AWS soundtrack API when configured, and otherwise falls back to the local Next.js route.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run linting:

```bash
npm run lint
```

Create a local env file from the example if needed:

```bash
cp .env.example .env.local
```

For local-only development, leave `NEXT_PUBLIC_SOUNDATLAS_API_URL` empty or omit
`.env.local`. The app will call the local route:

```text
/api/audio?countryCode=FI
```

To use the deployed AWS backend, set the public API base URL in `.env.local`:

```bash
NEXT_PUBLIC_SOUNDATLAS_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```

With that value set, the frontend calls:

```text
$NEXT_PUBLIC_SOUNDATLAS_API_URL/soundtrack?countryCode=FI
```

If the AWS request fails because of a network, CORS, or server error, the app
tries the local Next.js route before showing "Soundtrack not available yet".

## What To Test

- Click a country on the world map.
- Confirm the side panel loads the curated country soundtrack from iTunes when a playable preview is available.
- Confirm the player says "Country soundtrack" and keeps the play button disabled until the preview is ready.
- Confirm weak or unavailable matches show "Soundtrack not available yet" instead of playing irrelevant music.
- Resize the browser to confirm the map and panel stack cleanly on small screens.

## Current Scope

- Interactive world map
- Clickable countries
- Country metadata layer with ISO, region, capital, aliases, and search cues
- Curated country soundtrack query layer
- Deterministic curated soundtrack seed at `src/data/soundAtlasCuratedSongs.json`
- Server-side audio proxy at `/api/audio?countryCode=FI`
- Optional AWS soundtrack API via `NEXT_PUBLIC_SOUNDATLAS_API_URL`
- AWS CDK backend definition in `infra/` for API Gateway, Lambda, and DynamoDB
- Real iTunes music preview playback
- Relevance filtering with blocked terms and preferred genres
- Responsive Tailwind layout

## Audio Provider Notes

- iTunes Search API is the only active audio provider.
- The curated dataset is the primary soundtrack source.
- The route tries each curated primary track first, then curated fallback terms, then the older dynamic search behavior as a final fallback.
- The route queries iTunes with `media=music`, `entity=song`, country storefront, `limit=10`, and curated country-specific terms.
- iTunes results use `previewUrl` as the playable audio URL.
- SoundAtlas prefers consistency and vibe quality over always playing something.
- The soundtrack selection logic is centralized in `src/server/audio/soundtrackLookup.ts` so the local Next route and AWS Lambda can share the same deterministic lookup path.

## Frontend Backend Selection

- No `NEXT_PUBLIC_SOUNDATLAS_API_URL`: use the local Next.js route at `/api/audio`.
- `NEXT_PUBLIC_SOUNDATLAS_API_URL` set: call the deployed AWS route at `/soundtrack`.
- AWS request fails: retry through the local Next.js route.
- Both routes fail or return no playable preview: show "Soundtrack not available yet".

## AWS Backend

The AWS target architecture is:

```text
Frontend
  -> API Gateway HTTP API
  -> Lambda: soundtrackLookup
  -> DynamoDB: SoundtrackCache
  -> iTunes Search API
```

The deployed API exposes `GET /soundtrack?countryCode=FI` and returns the same
`{ results }` shape as the local `/api/audio` route, with cache metadata added.
Set `NEXT_PUBLIC_SOUNDATLAS_API_URL` in `.env.local` to make the frontend use it.

The DynamoDB cache is keyed by `countryCode`, stores the normalized soundtrack
metadata, artwork URL, preview URL, and timestamp, and uses a 7-day TTL.

Deployment instructions live in [`infra/README.md`](infra/README.md).
