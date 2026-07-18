# Product flow

The complete user journey, stage by stage. The project shell shows a seven-step progression
indicator (Media → Creative brief → Production plan → Highlights → Story → First cut → Finish);
stages unlock forward as work completes and always remain open backward.

## 1. Landing (`/`)
Public page: hero ("Your videos already contain a story."), product preview, how-it-works,
use-case cards, privacy footer. CTA → create project.

## 2. Projects dashboard (`/projects`)
Visual cards with cover, story type, stage, progress %, media/highlight counts, estimated length,
and last-edited time. Search, sort, delete (with confirmation), empty state.

## 3. Create project (`/projects/new`)
Name, optional description, story type (eight cards), guided-template vs. blank-brief choice.
"Progression story" + template pre-fills useful brief defaults.

## 4. Media library (`…/media`)
Drag-and-drop or file-picker upload (multiple files, per-file progress, validation, 2 GB cap),
mocked Google Photos / Drive / Dropbox connect flows, grid/list toggle, search/filter/sort,
multi-select removal, and a detail drawer (playback for real uploads, notes, mark-important).

## 5. Creative brief (`…/brief`)
The heart of the product: one large prompt — *"What story do you want to tell?"* — plus optional
guided controls (length, tones, structure, audience, title, ending) and example briefs. Save draft
or **Generate production plan**.

## 6. Production plan (`…/plan`)
Eight editable sections (goal, highlight selection, story building, music, visual, transitions,
titles, export). Each: edit → apply, lock, regenerate, reset-to-AI, with AI/edited/locked badges.
"Update all unlocked sections" regenerates around locks. Conflict warning when essential-highlight
minutes exceed the target length. CTA → **Find my highlights**.

## 7. Analysis progress (inside `…/highlights`)
Six named phases with a findings feed ("Found a possible first successful turn…"). The job is
DB-persisted — leave and return freely.

## 8. Highlight review (`…/highlights`)
Cards with poster, time range, AI title/description/reasoning, category, and four scores. Actions:
approve, reject, favorite, essential/optional, category change, trim (dual-handle modal with
restore-AI and notes), per-card and bulk. Views: review queue / approved / rejected / essential /
all + category filter. Summary panel: counts, approved duration, story-coverage strength meter.
CTA → **Build my story**.

## 9. Story builder (`…/story`)
Four chapters with descriptions and durations. Per clip: drag to reorder, duration, transition,
move-to-chapter, lock, remove, replace-from-approved. Add title cards; regenerate one chapter or
the whole story; undo/redo (server-persisted). The revision assistant panel accepts plain-language
instructions and returns a proposed change list — nothing applies until the user says so.

## 10. First-cut editor (`…/editor`)
Large preview player (simulated playback across the whole timeline; real uploads play natively),
clickable story strip, and a five-tab panel: **Clip** (duration/transition/lock/remove, title-card
text), **Story** (chapter jump), **Sound** (mood, five licensed tracks with energy curves, volume,
natural-audio/ducking/sync/fades), **Style** (seven presets + stabilization/color/exposure/slow-mo/
horizon/crop/grain/vignette), **Text** (opening/closing titles, date/location/milestone toggles,
watermark). Persistent revision assistant underneath.

## 11. Export (`…/export`)
Aspect (16:9 / 9:16 / 1:1), resolution (720p/1080p, 4K placeholder), six-phase render progress,
then the success state: preview frame, duration/size/resolution/date, download, private share link,
coming-soon publish targets, create-another-version. The structured render plan is viewable here.
