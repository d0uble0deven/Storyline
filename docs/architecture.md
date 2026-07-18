# Architecture

Storyline is a state machine wearing a film-studio coat. Every screen reads and writes structured
project state; the generative steps are services behind interfaces. If the state model stays right,
swapping mock AI for real AI is a service-layer change.

## Frontend (`apps/web`)

- **React 19 + Vite + TypeScript + React Router 7.** One route per screen:
  landing → dashboard → create → project shell (`/projects/:id`) with nested stage routes
  (`media`, `brief`, `plan`, `highlights`, `story`, `editor`, `export`).
- **CSS Modules + design tokens.** All visual decisions live in `src/styles/tokens.css`
  (color, type scale, spacing, radius, shadows, motion, z-index). Components consume tokens only.
- **Atomic components.** `atoms/` (Button, Input, Toggle, Progress…), `molecules/` (FormField,
  Modal, UploadDropzone, ScoreIndicator…), `organisms/` (AppShell, ProjectCard, HighlightCard,
  VideoPreview, RevisionAssistant). Screen-specific composites stay local to their route file.
- **Server state = TanStack Query** (`src/api/hooks.ts`, one hook per resource, optimistic updates
  for highlight review). **UI state = plain React state** (selections, modals, tabs). They never mix.
- **The save indicator** in the project top bar derives from `useIsMutating()` — any in-flight
  mutation shows "Saving…", otherwise "All changes saved".
- **Uploads:** the browser probes duration/dimensions and captures a poster frame via
  `<video>` + canvas (`src/lib/videoProbe.ts`), then streams a multipart XHR with progress. The
  server never needs FFmpeg for metadata.

## Backend (`apps/api`)

Layered: **routes → services → repositories → db.**

- **Routes** validate input with shared Zod schemas (`parse()` throws a 400 `AppError`) and stay
  thin. Central error middleware maps `AppError`/Multer/JSON errors to friendly messages; raw stack
  traces never reach the client.
- **Repositories** are hand-written SQL modules (no ORM), one per table, mapping snake_case rows to
  the shared camelCase domain types. Deep structures (plan sections, scores, chapters, settings)
  are JSON columns; anything filtered or counted is a real column.
- **Jobs** (`services/jobs.ts`): analysis and export run as DB-persisted jobs advanced by an
  in-process ticker. Progress, phase, and findings live in the `jobs` table, so leaving the page —
  or restarting the browser — never loses a run. The frontend polls the status endpoints. Tests
  drive `tickJobs()` manually for determinism.
- **Story history:** undo/redo stacks are persisted with the story row (capped at 20 entries), so
  undo survives refresh. Applying a revision pushes the previous story automatically.

## Database

SQLite via the built-in `node:sqlite` (`DatabaseSync`) — synchronous, fast, and free of native-ABI
rebuild pain. Schema lives in `src/db/db.ts` and is applied idempotently on open. Tables:
`projects`, `media_items`, `highlights`, `stories`, `revisions`, `jobs`.

## Service boundaries

The four AI stages are interfaces in `services/ai/types.ts` with mock implementations selected by
the factory in `services/ai/index.ts`:

| Interface | Mock behavior today | Real implementation later |
|---|---|---|
| `CreativeProducer` | Template + keyword expansion of the brief | LLM structured output |
| `HighlightCurator` | Curated dataset for demo media, hashed generics otherwise | Video understanding models |
| `StoryEditor` | Chronological chaptering with narrative purposes | LLM over highlight metadata |
| `RevisionAssistant` | ~9 prompt patterns doing real structural diffs | LLM with structured edit ops |

`RenderService` is the fifth seam: today it simulates phases and serves a placeholder file; later
it compiles the stored `RenderPlan` into FFmpeg/cloud jobs (see video-processing-roadmap.md).

## Shared types (`packages/shared`)

One package holds the domain model, constants (stages, categories, tones, music tracks, job
phases), and the Zod schemas. The API validates with the schemas; the web app imports the inferred
types; drift between the two apps is a compile error.

## Error handling

- API: typed `AppError(status, friendlyMessage)`; validation errors list the offending fields;
  everything else becomes a 500 with a generic message and a server-side log.
- Web: every mutation surfaces `error.message` inline near the action that failed; queries render
  empty/error states with recovery actions (retry, navigate). Upload failures are per-file and
  dismissible.
