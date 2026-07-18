# Video processing roadmap

The MVP stores and displays a structured render plan without executing it. This document describes
the pipeline that will make it real.

```
Upload
→ Object storage            (resumable uploads; originals never re-encoded)
→ Proxy generation          (low-res H.264 proxies + thumbnails + audio waveforms)
→ Scene detection           (shot boundaries, motion/exposure stats)
→ Video understanding       (per-segment descriptions, transcripts, quality signals)
→ Highlight scoring         (curator stage: segments × production plan → scored candidates)
→ User review               (already built — approve/reject/trim/prioritize)
→ Story generation          (already built — chapters, order, transitions, music phases)
→ FFmpeg render plan        (compile RenderPlan → filter graph / job spec)
→ Preview render            (fast low-res draft for the editor)
→ Final render              (full-quality export, then delivery)
```

## The render plan is the contract

`RenderPlan` (in `@storyline/shared`, served by `GET /api/projects/:id/render-plan`) already
records everything a deterministic engine needs: output dimensions/framerate/format, and for every
clip — source media, source in/out, timeline position, transition, speed, and audio gain, plus
music, title, and watermark settings. Planned per-clip extensions: crop/scale, stabilization flag,
and color treatment.

Execution targets, in order of likely adoption:

1. **Local FFmpeg** — translate clips to `trim`/`concat`/`xfade`/`amix` filter graphs. Good enough
   for 1080p exports on a laptop.
2. **Cloud render workers** — the same plan shipped to a queue; workers pull proxies/originals from
   object storage. Needed for 4K and for the web-only product.
3. **Remotion composition** — the plan as props to a React composition, if title/graphic richness
   outgrows filter graphs.

## Placement in the current code

- `services/renderPlan.ts` builds the plan (pure function — reusable as the compiler front-end).
- `services/jobs.ts` owns the job lifecycle; `completeJob()` for exports is where a real engine
  call replaces the simulation.
- The uploads directory abstraction (`UPLOADS_DIR`) is the seam for object storage.
