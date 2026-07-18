# Storyline — MVP Architecture & Implementation Plan

> **Storyline** turns a library of personal videos into a meaningful story without requiring
> video-editing experience. It feels like an AI producer and editor, not a timeline tool.
>
> Tagline: *Turn your memories into stories.*

This document is the approved pre-implementation plan: requirements review, architecture,
repository structure, dependencies, real-vs-mocked boundaries, and the phased build plan.

---

## 1. Requirements review

What we're building: a full-workflow storytelling app where a user uploads videos, writes one
creative brief, and is guided through AI-assisted highlight review, story assembly,
conversational revision, post-production, and export. The MVP's job is to make the
**complete experience real and believable** while the AI and rendering are deterministic mocks
behind clean interfaces.

Key observations that shape the design:

- **The product is a state machine, not a video pipeline.** Every screen reads and writes
  structured project state (plan sections, highlight statuses, story chapters, settings). If that
  state model is right, swapping mock AI for real AI later is a service-layer change only.
- **The seeded bike project ("My First Year Riding") is the demo.** It must be rich enough to
  carry every screen: ~20 media items, ~28 highlights across categories/months, a pre-built
  production plan, and a four-chapter story. Seed quality is a first-class deliverable.
- **Two things genuinely have to work with real data:** file upload (drag-drop, validation,
  progress, persistence) and all user editing (approve/reject, trim, reorder, lock, revise,
  settings). Everything generative is mocked deterministically.
- **"Leave and return" during analysis/export** means job progress must live in the database and
  be polled — not in a component's local state.
- **No FFmpeg in the MVP** means the server can't extract thumbnails or duration from uploads.
  Instead the browser does it: a `<video>` element + canvas reads duration/dimensions and
  captures a poster frame client-side, uploaded alongside the file. Real uploads therefore get
  real thumbnails and real playback. Seeded demo media gets art-directed generated poster images
  (SVG scenes — dawn parking lot, sunset trail, rainy street) with **simulated playback**
  (progress bar animating over the poster). The player component treats both identically.

## 2. Architecture

**Monorepo, npm workspaces, three packages:**

- **`apps/web`** — Vite + React + TypeScript + React Router + CSS Modules. Atomic component
  library (`components/atoms|molecules|organisms`), route-per-screen under `routes/`, design
  tokens as CSS custom properties in a single `tokens.css`.
- **`apps/api`** — Express 5 + TypeScript, REST endpoints per the spec. Layered:
  `routes → services → repositories → db`. All generative behavior lives behind the four AI
  interfaces (`CreativeProducer`, `HighlightCurator`, `StoryEditor`, `RevisionAssistant`) plus a
  `RenderService` — mock implementations are the only ones for now, chosen via a factory so real
  ones drop in later.
- **`packages/shared`** — the TypeScript domain model plus Zod schemas for API input validation.
  Zod schemas are the single source of truth: the API validates with them, the web app imports
  the inferred types, so frontend/backend can't drift.

**Database: SQLite via the built-in `node:sqlite`** (verified working on Node 26.0.0, no flags).
Synchronous API like better-sqlite3, but zero native modules — no ABI rebuilds when Node
upgrades. Hand-written SQL in small repository modules, no ORM. Real columns for anything we
query/filter on (status, category, priority, stage, dates); JSON columns for deep nested
structures (plan sections, scores, story chapters, post-production settings, render plan).

**Uploads:** `multer` → local `apps/api/uploads/` directory, served statically with sanitized
paths. Metadata and poster frame arrive from the browser as described above.

**Jobs (analysis + export):** a `jobs` table with type, phase, progress, and a findings log
(the "Found an early clip that shows balance difficulty" messages). A small in-process ticker
advances phases on a timer and writes to the DB; the frontend polls the status endpoint.
Survives refresh and leave-and-return; no websockets needed.

**Frontend state:** TanStack Query for server state (caching, invalidation, optimistic updates,
loading/error states), plain React context/reducers for UI-only state (selection sets, modals,
review-queue position). Undo/redo for story revisions is server-backed via the revisions
history, not an in-memory stack, so it survives refresh.

**Mock AI determinism:** every mock derives its output from actual project content — the
curator reads seeded media items and emits highlights tied to them; the revision assistant
pattern-matches prompts ("shorter", "more early", "stronger ending", ~8 patterns) against the
real current story and produces genuine structural diffs, with a plausible generic fallback.
Same input → same output, so demos are repeatable.

## 3. Repository structure

```
storyline/
  package.json              # workspaces root; dev/build/test scripts
  tsconfig.base.json
  apps/
    web/
      src/
        components/atoms|molecules|organisms/   # each: Component.tsx + .module.css
        routes/               # landing, projects, project/{media,brief,plan,highlights,story,editor,export}
        api/                  # typed fetch client + query hooks
        styles/tokens.css     # design tokens (color, type, spacing, radius, motion, z)
        lib/                  # video-metadata probe, formatters
    api/
      src/
        routes/               # one router per resource
        services/             # project, media, story, jobs
        services/ai/          # interfaces + mock implementations + factory
        repositories/         # hand-written SQL per table
        db/                   # schema.sql, migrate, seed/
      uploads/                # gitignored
      data/storyline.db       # gitignored
  packages/
    shared/src/               # domain types, zod schemas, constants (categories, stages, tones)
  docs/
    architecture.md  product-flow.md  ai-services.md
    video-processing-roadmap.md  google-photos-integration.md
```

## 4. Minimum dependencies

| Where  | Runtime | Dev |
|--------|---------|-----|
| web    | react, react-dom, react-router-dom, @tanstack/react-query, @dnd-kit/core + @dnd-kit/sortable | vite, @vitejs/plugin-react, vitest, @testing-library/react, jsdom |
| api    | express, multer, zod | tsx (dev runner), vitest, supertest |
| shared | zod | — |
| root   | — | typescript, eslint + typescript-eslint, concurrently, playwright (added in Phase 9 only) |

Explicitly **not** used: Tailwind/shadcn/any UI kit, ORM, better-sqlite3, CSS-in-JS, animation
libraries, state-management libraries.

The two judgment calls, per the "small focused packages" rule:

- **@dnd-kit** — story reordering with keyboard accessibility; native HTML5 DnD fails the
  accessibility bar.
- **TanStack Query** — hand-rolling cache invalidation + optimistic updates across ten screens
  is where lean turns into bug-prone.

## 5. Real vs. mocked

| Fully real | Mocked (behind interfaces) |
|---|---|
| All CRUD + persistence (projects, media, brief, plan edits, highlight review state, story edits, settings, revision history) | Production-plan generation (template + brief-keyword extraction) |
| File upload: drag-drop, validation, progress, disk storage, browser-side metadata + thumbnail capture | Video analysis job (timed phases, DB-persisted, believable findings feed) |
| Playback of real uploaded files | Highlight generation (~28 seeded, believable scores + reasoning) |
| Search/filter/sort, bulk actions, trim state, lock state, drag-reorder, undo/redo | Story generation (4 chapters, chronological, narrative purposes) |
| Conflict detection (real math: essential-highlight minutes vs. target length) | Revision interpretation (~8 keyword patterns + generic fallback, real structural diffs) |
| Job progress tracking, export records, render-plan storage & display | Render/export (timed phases; download serves a bundled placeholder MP4 + the structured render plan) |
| Accessibility, responsive layout, routing, seed script | Google Photos / Drive / Dropbox (polished "coming soon" connect flows) |

## 6. Phased implementation plan

Work proceeds in strict phases. **After every phase: STOP**, summarize what changed, give exact
test steps and expected results, and wait for explicit approval before continuing.

Every phase gate: typecheck, lint, tests, production build, boot both servers, check browser
console + server logs.

1. **Foundation** — workspaces, tsconfigs, ESLint, Vite + Express skeletons, shared types + Zod
   schemas, design tokens, app shell (sidebar, top bar, stage indicator), SQLite schema +
   migration + full bike-project seed.
   *Gate: both servers boot; seeded project visible via API.*
2. **Projects & navigation** — landing page, projects dashboard (cards, search, sort, empty
   state), create-project flow with story-type defaults, project shell + stage navigation.
   *Gate: create → navigate → refresh persists.*
3. **Media library** — upload (drag-drop, validation, progress, browser-side metadata/thumbnail),
   media grid + filters + statuses, detail drawer, mock connector cards.
   *Gate: real file uploads, plays back, survives refresh.*
4. **Creative brief & production plan** — brief screen with guided controls (pre-populated bike
   prompt), mock plan generation, per-section edit/lock/regenerate/reset with AI-vs-edited
   distinction, conflict warning.
   *Gate: edits and locks persist; regenerate respects locks.*
5. **Highlight review** — analysis job with phased progress + findings (leave-and-return works),
   highlight cards with scores/reasoning, all review actions, views, bulk actions, trim modal,
   summary panel with story coverage.
   *Gate: review state persists; summary math is correct.*
6. **Story builder** — story generation, chapter view, dnd-kit reordering, replace/lock/title
   cards, revision assistant with change summaries, undo/redo via revision history.
   *Gate: reorder + applied revision persist across refresh.*
7. **First cut & post-production** — preview workspace (real playback for uploads, simulated for
   seeded media), story strip, contextual tabs, music/style/transitions/titles/watermark
   settings.
   *Gate: every setting round-trips to the DB.*
8. **Export** — format/resolution config, mock render job with phased progress, success state,
   placeholder download, stored render plan viewable.
   *Gate: full happy path end-to-end.*
9. **Polish** — responsive passes, accessibility audit (focus management, reduced motion,
   screen-reader text), error/empty/loading states everywhere, Playwright happy-path e2e,
   README + the five docs files.

## 7. Confirmed decisions

1. **`node:sqlite`** over better-sqlite3 (verified working on Node 26; kills the ABI pitfall).
2. **TanStack Query + @dnd-kit** as the only two non-obvious frontend packages.
3. **npm workspaces monorepo**, local git repo (no remote required yet).
4. **Browser-side media metadata/thumbnails** for real uploads; simulated playback for seeded
   demo media.

## Environment

- Node 26.0.0 (`/opt/homebrew/bin/node`), npm 11.12.1, macOS.
- Two dev processes: API (Express) and web (Vite, proxying `/api`).
