# Storyline Phase 2 — From Believable Mock to Fully Functional

> **Purpose:** everything required to make Storyline *actually* work — upload real videos and photos
> in a variety of formats, and generate a real finished video from a prompt. Covers the build
> workstreams, hard constraints (files, storage, duration), model selection per AI task with
> reasoning, and estimated cost per finished video. This is a draft for review; we'll revise it
> into the committed Phase 2 roadmap.
>
> All prices and limits verified **July 2026** and linked in [Sources](#sources). Re-verify before
> committing budgets — model pricing moves quarterly.

---

## 1. TL;DR

- **Two hard systems are missing:** real media processing (FFmpeg ingestion + rendering) and real
  AI (video understanding + the four LLM stages). Everything else — UI, data model, review flow,
  jobs — already works and doesn't change.
- **The LLM landscape forces a two-vendor design:** Google **Gemini** is the only major API with
  native video-file input (frames + audio together), so it does video analysis. **Claude** is the
  best structured-decision engine, so it does the producer/story/revision stages. OpenAI's API
  still has no native video input (frames-as-images workaround only) — not competitive here.
- **The LLM never touches pixels.** All models output structured decisions (the `RenderPlan` we
  already store); **FFmpeg deterministically renders the actual MP4**. No "AI video generation"
  (Veo/Sora) is involved — we cut *your* footage, we don't synthesize new footage.
- **Cost per finished video (AI only): roughly $0.35 (budget) / $2.30 (recommended) / $5.75
  (premium)** for a typical project (60 min of source footage, 30 photos, 3 revision rounds).
  The dominant cost is Gemini video analysis — everything Claude does costs cents.
- **Non-AI costs are small:** ~$0.10–0.25/project-month storage, ~$0.05–0.30/video cloud
  rendering (or free locally).

---

## 2. Gap analysis — what's mocked today, what replaces it

| Today (mock) | Phase 2 (real) | Workstream |
|---|---|---|
| Uploads accepted but never processed; browser probes metadata | FFmpeg ingestion: normalize, proxy, thumbnails, audio extraction; photo support (HEIC etc.) | A |
| Analysis job = timer + hand-written highlight dataset | Scene detection + Gemini video understanding → real highlights with real timestamps | B |
| Producer/story/revision = keyword templates | Claude calls with structured outputs, mapped to the existing Zod schemas | C |
| Export = timer + 1 KB stub file | FFmpeg render engine executing the stored `RenderPlan` → real MP4 (all aspect ratios) | D |
| Jobs = in-process tick simulator | Real queue (BullMQ + Redis) with FFmpeg/API progress | E |
| Local single-user, SQLite, local disk | (Later) auth, object storage, Postgres, billing, sharing | F |

The four AI interfaces (`CreativeProducer`, `HighlightCurator`, `StoryEditor`,
`RevisionAssistant`) and `RenderPlan` were designed for exactly this swap — routes and UI don't
change.

---

## 3. Target pipeline

```
Upload (any format, resumable)
  → Object storage (originals, immutable)
  → INGEST worker (FFmpeg): validate → extract metadata/EXIF
      → 720p H.264 proxy + poster + filmstrip thumbnails + audio track
      → photos: HEIC/RAW → JPEG + display sizes
  → ANALYZE worker: scene detection (local, free)
      → upload proxy to Gemini Files API → structured highlight JSON per clip
      → (photos: single Gemini image call, batched)
  → User review (unchanged)
  → STORY: Claude builds chapters from highlight metadata (unchanged UI)
  → REVISIONS: Claude proposes structured edits (unchanged UI)
  → RENDER worker (FFmpeg): RenderPlan → trim/concat/xfade/zoompan/drawtext/audio mix
      → preview render (fast, 540p) → final render (720p/1080p, all aspects)
  → Download / share
```

Key principle unchanged from the MVP: **AI produces structured decisions; a deterministic media
engine executes them.**

---

## 4. Workstreams — what has to be built

Sizes: **S** ≈ a session, **M** ≈ 2–4 sessions, **L** ≈ a week-scale effort.

### A. Real ingestion & format normalization (M)
- Server-side **FFmpeg/ffprobe** (installed via Homebrew locally; bundled in the worker image later).
- On upload: `ffprobe` validation + metadata (duration, dims, codec, rotation, creation date, GPS).
- Transcode every video to a **720p H.264/AAC proxy** (fixes browser-unplayable formats: MKV, AVI,
  WMV, HEVC-in-MOV from iPhones, 10-bit footage). Originals kept untouched for final render.
- Generate poster frame + 8-frame filmstrip (the trim modal becomes real) + extracted audio.
- **Photos become first-class media**: accept JPEG/PNG/HEIC/WebP/TIFF, convert HEIC via `sharp`,
  read EXIF dates. At render time photos become Ken Burns clips (FFmpeg `zoompan`).
- Resumable uploads (tus protocol or S3 multipart) so a 2 GB file survives a Wi-Fi blip.

### B. Real video analysis (M–L)
- **Scene detection locally** (PySceneDetect or FFmpeg `scdet`) — free, fast, gives candidate
  segment boundaries so Gemini prompts can reference them.
- Upload proxies to the **Gemini Files API**; one structured-output request per clip (batched for
  small clips): input = production plan's highlight instructions + the video; output = candidate
  highlights with timestamps, category, scores, reasoning — matching our existing `Highlight`
  schema. Findings feed comes from real intermediate results.
- Audio understanding (speech, laughter, cheering) comes **free inside the same Gemini call** —
  video tokens include the audio track. Optional later: dedicated STT (Whisper ~$0.006/min) only
  if we want word-level captions.
- Cost lever built in from day one: **media resolution setting** (default vs low) and a
  **two-pass mode** (cheap triage pass → detailed pass on promising segments only).

### C. Real Claude stages (S–M)
- Swap the factory in `services/ai/index.ts`; keep mocks selectable via env for tests/demo.
- All three stages use **structured outputs** (`output_config.format` with JSON schema) so
  responses are guaranteed to parse into our existing Zod schemas — no prompt-fragile JSON.
- **Prompt caching** on the stable context (production plan + highlight metadata) makes repeated
  revisions ~90% cheaper on input.
- Deterministic mocks stay as the test fixtures (CI never calls paid APIs).

### D. Real rendering (L) — the biggest single build
- A **RenderPlan → FFmpeg compiler**: trims via `trim/atrim`, joins via `concat`, transitions via
  `xfade` (cut/dissolve/fade/dip-to-black), photos via `zoompan` (Ken Burns), titles via
  `drawtext` or ASS subtitles (opening/closing/milestone cards, watermark), audio via `amix` +
  sidechain ducking (music under speech) + `loudnorm`, aspect variants via smart `crop/scale/pad`.
- Two-quality strategy: **preview render** (fast 540p, for the editor) and **final render**
  (720p/1080p; 4K later).
- **Music is a licensing problem, not a tech problem**: ship with CC0/royalty-free tracks
  matching our five mock titles, or integrate a licensed library API (Artlist/Epidemic/
  Soundstripe) later. We cannot ship copyrighted music.

### E. Real jobs (S–M)
- Replace the tick simulator with **BullMQ + Redis** (or keep the DB-backed queue and add real
  workers — decision point). Progress comes from FFmpeg's `-progress` output and Gemini call
  completion — the existing UI polling just starts showing real numbers.

### F. Multi-user platform (L — deferred, not required for "fully functional locally")
- Auth (Clerk/Auth.js), Postgres migration, S3/R2 object storage, billing (Stripe metered on
  minutes analyzed + renders), share links, GDPR-grade deletion. The current architecture seams
  (repositories, `UPLOADS_DIR`, service factory) were built for this.

---

## 5. Constraints you'll live with

### File types

| Kind | Accept at upload | Notes |
|---|---|---|
| Video | MP4, MOV, WebM, MKV, AVI, MPEG/MPG, WMV, 3GP, M4V | Everything is transcoded to an H.264 proxy, so browser playback and Gemini compatibility stop being the user's problem. Gemini natively accepts mp4/mpeg/mov/avi/flv/mpg/webm/wmv/3gpp — our proxy (mp4) always qualifies. |
| Photos | JPEG, PNG, HEIC/HEIF, WebP, TIFF | HEIC (default on iPhones) must be converted server-side — browsers won't display it. |
| Audio (later) | MP3, M4A, WAV | For user-uploaded music. |

### Size & duration limits

| Constraint | Limit | Why / source |
|---|---|---|
| Per-file upload | **2 GB now → raise to ~10 GB** with resumable uploads | Our current cap is arbitrary; with tus/multipart the practical limit is storage cost + upload time (10 GB ≈ 25 min on 50 Mbps up). |
| Per-clip duration for analysis | **≤ 1 hour** per Gemini request at default resolution (~3 hours at low res) | 1M-token context; a 1-hour clip ≈ 1.08M tokens at ~300 tokens/sec. Longer clips get chunked automatically. |
| Gemini file upload | 20 GB/file (paid tier), 48-hour retention | Files API — not our binding constraint since we upload 720p proxies (~10% of original size). |
| Project size | Practically **~5–10 hours of footage** | Not a hard limit; analysis cost scales linearly with minutes (see §7) — this is a product/pricing decision, not a technical one. |
| Claude context | Effectively unlimited for our use | Story/revision payloads are 10–30K tokens against a 1M window. Claude takes **images** (≤2576px long edge) but *not video* — it never sees the footage, only highlight metadata. |
| Render output | 720p/1080p all aspect ratios; 4K deferred | 4K quadruples render time/cost for little demo value. |

### Storage math (rule of thumb)

| Item | Size |
|---|---|
| 1 min phone video (1080p HEVC / H.264) | ~60 / ~130 MB |
| Typical project (60 min footage + 30 photos) | **6–10 GB originals** + ~0.8 GB proxies/thumbnails + ~0.4 GB finished renders |
| Cloud cost (Cloudflare R2 @ $0.015/GB-mo, zero egress fees) | **~$0.10–0.17/project/month**; S3 comparable on storage but charges egress |

### Other constraints
- **API rate limits:** Gemini and Anthropic per-minute token limits shape how many clips we
  analyze in parallel (a queue concern, not a feasibility one). Batch APIs give 50% off both
  vendors for non-interactive work — analysis is a natural fit.
- **Gemini samples video at 1 fps** — fine for "what happens in this clip," blind to single-frame
  events (a ball crossing a line). Acceptable for memories; worth stating in docs.
- **Music licensing** is the only true legal constraint (above).
- **Rendering time:** ~0.5–2× realtime per output minute on a laptop; a 4-min video renders in
  roughly 2–8 min locally.

---

## 6. Which model for which task — and why

The deciding fact: **only Gemini's API accepts video files natively** (frames + audio in one
call). Claude has no video input; OpenAI's API requires client-side frame extraction (loses
audio, adds pipeline complexity, typically costs more per minute). So: Gemini watches, Claude
thinks.

### Task-by-task

| Stage | Recommended | Why | Alternatives |
|---|---|---|---|
| **Highlight curation** (watch footage, propose moments) | **Gemini 3.5 Flash** | Native video+audio input; structured JSON output; strong temporal reasoning; $1.50/M input is the sweet spot for 1M+ tokens of video per project | *Budget:* Gemini 2.5 Flash at low res (5–10× cheaper, noticeably coarser). *Premium:* Gemini 3.1 Pro (better nuance on emotional beats, ~3× cost). *Not viable:* Claude (no video), OpenAI (frames-only workaround) |
| **Creative producer** (brief → production plan) | **Claude Sonnet 5** | The plan is user-facing prose in the brand voice — Claude's writing quality matters here; structured outputs map 1:1 to our `ProductionPlan` schema; cost is negligible | Haiku 4.5 (fine, blander prose); Opus 4.8 (overkill for this task) |
| **Story editor** (highlights → chapters/narrative) | **Claude Opus 4.8** | This IS the product — narrative judgment over ~10K tokens of metadata. Best reasoning available, and at these token counts it costs ~$0.15/story. Cheap insurance on the core experience | Sonnet 5 (90% as good at ~60% of the—already tiny—cost) |
| **Revision assistant** (prompt → structured edits) | **Claude Sonnet 5** | Interactive latency matters; excellent instruction-following for structured edit operations; prompt caching makes repeat revisions very cheap | Opus 4.8 for gnarly multi-constraint revisions; Haiku for simple ones (could route by prompt complexity later) |
| **Titles/copy polish, media summaries** | **Claude Haiku 4.5** | High-volume, low-stakes text at $1/M | — |
| **Speech-to-text** (optional, captions) | **Gemini (built-in)** | Audio is already understood inside the video-analysis call at no extra step | Whisper API (~$0.006/min) only when word-level timing is needed |
| **Rendering** | **FFmpeg** (not an LLM) | Deterministic, free, proven. LLMs must never render pixels | Remotion (if title/graphics richness outgrows filter graphs); cloud render workers at scale |

### Reference pricing (July 2026)

| Model | Input $/M tok | Output $/M tok | Video input |
|---|---|---|---|
| Gemini 3.5 Flash | $1.50 | $9.00 | ✅ ~300 tok/sec (default res), ~100 (low res) |
| Gemini 2.5 Flash | $0.30 | $2.50 | ✅ same rates |
| Gemini 3.1 Pro | $2.00–4.00 | $12.00–18.00 | ✅ same rates |
| Claude Opus 4.8 | $5.00 | $25.00 | ❌ (images only) |
| Claude Sonnet 5 | $3.00 *(intro $2.00 → 2026-08-31)* | $15.00 *(intro $10.00)* | ❌ |
| Claude Haiku 4.5 | $1.00 | $5.00 | ❌ |

Batch APIs: 50% off on both vendors — applicable to analysis, not to interactive stages.

---

## 7. Cost per finished video (worked example)

**Scenario:** 60 min of source footage across ~40 clips + 30 photos → one 4-minute video, with a
plan generation, 2 plan tweaks, story generation, and 3 revision rounds.

**Token estimates:** video 3600 sec × 300 tok/sec = **1.08M tokens** (default res) or 360K (low
res); photos ~8K tokens total; curation output ~20K tokens of highlight JSON; Claude stages:
plan ≈ 2K in/1.5K out per call, story ≈ 10K in/4K out, revision ≈ 12K in/3K out per round.

### Per-stage, per-model

| Stage | Model option | Approx cost / video |
|---|---|---|
| Highlight curation (60 min) | Gemini 2.5 Flash, low res | **$0.16** |
| | Gemini 2.5 Flash, default res | $0.37 |
| | Gemini 3.5 Flash, low res | $0.72 |
| | **Gemini 3.5 Flash, default res** ★ | **$1.80** |
| | Gemini 3.1 Pro, default res | $4.70 |
| Creative producer (×3 calls) | Haiku 4.5 | $0.02 |
| | **Sonnet 5** ★ | **$0.05** |
| | Opus 4.8 | $0.15 |
| Story generation | Sonnet 5 | $0.07 |
| | **Opus 4.8** ★ | **$0.15** |
| Revisions (×3, with prompt caching) | Haiku 4.5 | $0.04 |
| | **Sonnet 5** ★ | **$0.15** |
| | Opus 4.8 | $0.35 |
| Speech-to-text (optional) | Whisper, 60 min | $0.36 |

### Three configurations

| Configuration | Choices | **AI cost / video** |
|---|---|---|
| **Budget** | 2.5 Flash low-res curation + Haiku/Sonnet text stages | **~$0.35** |
| **Recommended** ★ | 3.5 Flash default-res curation + Sonnet plan/revisions + Opus story | **~$2.30** |
| **Premium** | 3.1 Pro curation + Opus everywhere + Whisper captions | **~$5.75** |

**Scaling intuition:** cost ≈ *minutes of footage analyzed* × $0.003–0.08/min (model- and
resolution-dependent) + ~$0.35 flat for all Claude stages. A 3-hour-footage wedding project at the
recommended tier ≈ $5.75; re-analysis is never repeated (results persist), and re-renders cost $0
in AI.

### Non-AI costs

| Item | Cost |
|---|---|
| Storage (R2) | ~$0.10–0.17 / project / month |
| Rendering | $0 local; ~$0.05–0.30/video on cloud workers (CPU minutes) |
| Redis (jobs) | $0 local; ~$5–10/mo hosted |
| Music licensing | $0 (CC0 starter pack) → $10–30/mo (licensed library subscription) later |

---

## 8. Proposed phasing (for discussion)

| Phase | Scope | Outcome |
|---|---|---|
| **2A — Real media, mock AI** (M–L) | Workstreams A + D + E: FFmpeg ingestion, proxies, photos, real render engine, real jobs — mocks still pick the highlights | Upload anything, and the export button produces a **real watchable MP4** cut from your actual footage. Biggest credibility jump per unit effort, zero API spend |
| **2B — Real AI** (M) | Workstreams B + C: Gemini curation + Claude stages behind env-flagged factory, cost controls (low-res mode, per-project caps, spend display) | The full promise: real videos in → prompt → real AI-selected, AI-structured, really-rendered film out. Still local, single-user |
| **2C — Platform** (L) | Workstream F: auth, Postgres, R2, billing, sharing | Other people can use it |

**Open decisions to settle in review:**
1. Budget vs recommended AI tier as the default (or: low-res triage always, full-res only on user-approved clips)?
2. Job queue: adopt BullMQ+Redis now, or extend the existing DB-backed queue with worker processes (no new infra)?
3. Photos in 2A or deferred to 2B?
4. Music: CC0 starter pack acceptable for 2A/2B?
5. Per-project footage cap for cost safety (e.g., 3 hours) while it's on your API keys?

---

## Sources

- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — model rates verified 2026-07
- [Gemini video understanding](https://ai.google.dev/gemini-api/docs/video-understanding) — token rates (~300/sec default, ~100/sec low res), 1-hour/1M-context limit, Files API 20 GB, supported formats, 1 fps sampling
- [Anthropic models & pricing](https://platform.claude.com/docs/en/about-claude/models/overview) — Opus 4.8 $5/$25, Sonnet 5 $3/$15 (intro $2/$10 through 2026-08-31), Haiku 4.5 $1/$5; vision is image-only (≤2576px)
- [OpenAI native video input — open feature request](https://github.com/openai/openai-node/issues/1778) and [community workaround thread](https://community.openai.com/t/workaround-for-video-analysis-question-about-getting-native-video-upload-access/1369186) — confirms no native video-file input in the OpenAI API as of mid-2026 (frames-as-images only)
