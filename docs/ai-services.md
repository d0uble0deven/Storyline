# AI services

Storyline never asks a model for a rendered video. AI produces **structured decisions**; a
deterministic engine (eventually) renders them. Four stages, each an interface in
`apps/api/src/services/ai/types.ts`, each currently backed by a deterministic mock.

## Stage 1 — Creative producer (`CreativeProducer`)

**Input:** creative brief (overview, length, tones, structure, audience, title, ending), story type.
**Output:** eight-section production plan; each section carries `value`, `originalAiValue`,
`isLocked`, `isUserEdited` so user edits and locks survive regeneration.

*Mocked today:* template sentences interpolated with brief facts (length, tones, structure), with a
bike-aware variant when the brief mentions riding, and alternating phrasings on regeneration.
*Real later:* one LLM call returning the eight sections as structured output, seeded with the story
template.

## Stage 2 — Highlight curator (`HighlightCurator`)

**Input:** production plan, media items (later: segments, transcripts, technical-quality signals).
**Output:** candidate highlights — source clip + in/out points, title, description, category,
five 0–10 scores (visual quality, story relevance, emotional value, progression value, uniqueness),
and a human-readable reason for the pick.

*Mocked today:* a hand-curated 30-highlight dataset keyed to the demo media (including deliberately
weak candidates and "imperfect but narratively valuable" clips), plus hash-seeded generic
candidates for unknown footage. Idempotent: media that already has highlights is skipped, so
re-running analysis is safe.
*Real later:* scene detection → proxy sampling → video-understanding model scoring segments against
the plan's highlight instructions.

## Stage 3 — Story editor (`StoryEditor`)

**Input:** approved highlights, production plan, user notes, target duration.
**Output:** chapters with titles/descriptions, ordered items with durations, narrative purposes,
transitions, music phases, and opening/closing title cards.

*Mocked today:* chronological quartile chaptering (progression stories get the
"Starting Out / Finding Balance / Going Further / Riding with Confidence" arc), category-derived
narrative purposes, dissolves at chapter boundaries, per-priority duration caps. Chapter
regeneration reorders by score for a visible alternative.
*Real later:* LLM over highlight metadata returning the same `StoryChapter[]` shape.

## Stage 4 — Revision assistant (`RevisionAssistant`)

**Input:** current chapters, highlight metadata, locked clips, the user's plain-language prompt.
**Output:** a proposal — summary, typed change list (including warnings about locked clips), and
the full proposed chapter structure. Nothing mutates until the user applies it.

*Mocked today:* ~9 recognized patterns performing real structural edits — `shorter` (drop optional
clips, trim 10%), `more early` (insert unused early highlights), `stronger ending` (move the
highest-scoring clip last, extend it, ensure a closing card), `energetic`, `fewer scenic`,
`rain…earlier`, `emotional`, `simplify transitions`, `repetitive`. Unrecognized prompts get a
believable fallback (tighten the two longest clips) that acknowledges the request. Locked clips are
never touched — skipping them adds a warning to the change list.
*Real later:* LLM emitting the same proposal shape as structured edit operations.

## Determinism policy

All mocks are pure functions of stored state (plus stable hashes of IDs) — the demo behaves
identically on every run, which makes the product believable and the tests exact.
