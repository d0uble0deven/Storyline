# Google Photos integration (planned)

Storyline will import from Google Photos using the **Google Photos Picker API** — the
user-mediated, consent-first flow — never by scraping shared-album pages.

## Why the Picker API

- The user selects exactly which videos to share in Google's own UI; Storyline never sees the rest
  of the library. This matches the product's privacy promise ("your videos remain private").
- Picker sessions return time-limited `baseUrl`s and media metadata without requiring the broad
  `photoslibrary.readonly` scope that Google now restricts.
- No brittle scraping, no ToS risk.

## Planned flow

1. **Connect** — OAuth with the Picker-scoped consent; store the refresh token per user (requires
   the future auth layer).
2. **Pick** — open a Picker session; the user selects videos; Storyline polls the session until
   `mediaItemsSet`.
3. **Import** — for each picked item, fetch bytes via `baseUrl=dv` (video download variant) into
   Storyline's storage as a normal `MediaItem` with `source: "google-photos"`, carrying
   `creationTime`, dimensions, and (when present) location.
4. **Revoke** — a visible "disconnect Google Photos" control that drops tokens; imported copies
   remain, clearly labeled, and can be deleted with the project.

## Seams already in place

- `MediaSource` includes `"google-photos"`; the media grid already displays and filters by source.
- The media screen ships a polished "connect" card with the coming-soon flow — the modal is where
  the OAuth window will open.
- Import lands in the same `createMedia` repository path uploads use, so analysis and highlights
  work identically for picked media.

## Open questions

- Whether to keep original bytes or proxies only (storage cost vs. re-download friction).
- Handling Google's URL expiry for re-imports (store media item IDs, refresh via a new session).
- Quota behavior for very large libraries (batch the picker sessions).
