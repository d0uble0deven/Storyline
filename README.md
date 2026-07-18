# Storyline

**Turn your memories into stories.**

Storyline is an AI-assisted video storytelling app. You add a library of personal videos, describe
the film you want in one creative brief, and Storyline finds the moments that matter, helps you
shape the narrative, and creates a finished video — without complicated editing tools. It behaves
like an AI producer and editor, not a timeline app: no keyframes, no codecs, no rendering graphs.

> **MVP status:** the complete user experience is real — projects, uploads, review, story editing,
> revisions, settings, and export all persist. The *generative* parts (video analysis, plan/story
> generation, revision interpretation, rendering) are deterministic mocks behind clean service
> interfaces, ready to be swapped for real AI and a real media engine.

_Screenshots: coming soon._

## Technology stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router 7, CSS Modules, TanStack Query, dnd-kit |
| Backend | Node.js, Express 5, TypeScript (run via tsx), Zod validation |
| Database | SQLite via the built-in `node:sqlite` — zero native modules |
| Shared | `@storyline/shared` — one domain model + Zod schemas for both apps |
| Testing | Vitest, React Testing Library, Supertest |

No Tailwind, no UI kit, no ORM — the design system and data layer are hand-built and small.

## Local setup

Requirements: **Node 24+** (uses the built-in `node:sqlite`; developed on Node 26).

```bash
npm install
npm run dev        # API on :4175, web on :5175 (Vite proxies /api and /uploads)
```

Open http://localhost:5175. On first boot the API seeds the demo database automatically.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run API + web together |
| `npm run dev:api` / `npm run dev:web` | Run one side |
| `npm run seed` | Reset and reseed the demo data (wipes all projects!) |
| `npm run typecheck` | TypeScript across all workspaces |
| `npm run lint` | ESLint |
| `npm test` | All test suites (shared schemas, web components, API end-to-end flow) |
| `npm run build` | Production build (web bundle + API typecheck) |

### Environment variables

All optional:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4175` | API port |
| `STORYLINE_DB_PATH` | `apps/api/data/storyline.db` | SQLite location (`:memory:` in tests) |
| `JOB_TICK_MS` / `JOB_STEP` | `900` / `6` | Speed of simulated analysis/export jobs |

## Project structure

```
apps/
  web/        React app — routes/ per screen, components/ (atoms → molecules → organisms),
              styles/tokens.css design tokens, api/ typed client + TanStack Query hooks
  api/        Express app — routes/ → repositories/ (hand-written SQL) → db/
              services/ai/   the four AI-stage interfaces + deterministic mocks
              services/jobs  DB-persisted job simulator (analysis & export survive refresh)
packages/
  shared/     Domain types, constants (stages, categories, tracks), Zod schemas
docs/         Architecture, product flow, AI services, rendering roadmap, Google Photos plan
```

## Seed data

The seed creates three projects; **My First Year Riding** is the full demo — 20 media items across
a year (Aug 2025 → Jun 2026) with generated SVG poster art, a complete creative brief and
production plan, 30 curated highlights (approved/rejected/needs-review, essential/optional, with
scores and AI reasoning), and a four-chapter first cut. `npm run seed` rebuilds it at any time.

## Mock services

Every generative feature sits behind an interface in `apps/api/src/services/ai/`:
`CreativeProducer`, `HighlightCurator`, `StoryEditor`, `RevisionAssistant` (see
[docs/ai-services.md](docs/ai-services.md)). The mocks are **deterministic** — same input, same
output — and content-aware: the curator emits highlights tied to the actual media rows, and the
revision assistant performs real structural edits on the actual story (≈9 recognized prompt
patterns plus a plausible fallback). Swapping in real models changes the factory in
`services/ai/index.ts` and nothing else.

## Testing

`npm test` runs three suites; the API suite (`apps/api/src/__tests__/flow.test.ts`) is an 18-step
end-to-end happy path: create project → upload → brief → plan (with locking) → analysis job →
review/trim/bulk actions → story generation → undo/redo → revision propose/apply → post-production
→ export job → download.

## Future integrations

The seams are in place for: Google Photos Picker ([docs/google-photos-integration.md](docs/google-photos-integration.md)),
Drive/Dropbox, resumable uploads to object storage, Gemini/OpenAI video understanding, FFmpeg or
cloud render workers ([docs/video-processing-roadmap.md](docs/video-processing-roadmap.md)),
speech-to-text, music libraries, auth, billing, and sharing.

## Known limitations

- Seeded demo media has poster art, not playable video files; the preview player simulates playback
  over posters (real uploads play natively). The export "download" serves a placeholder file
  (a real MP4 if `ffmpeg` was available at seed time, otherwise a stub).
- The web bundle is a single chunk (~500 KB); code-splitting is deliberate future polish.
- Single-user, local-only: no auth, no cloud storage, no real sharing links.
- Music tracks are metadata-only (no audio assets); "preview" is simulated.
- Drag-and-drop reorders clips within a chapter; moving across chapters uses the chapter dropdown.
