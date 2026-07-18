import type { Highlight, RevisionChange, StoryChapter, StoryItem } from "@storyline/shared";
import type { RevisionAssistant, RevisionProposal } from "./types.js";

type Ctx = {
  chapters: StoryChapter[];
  byId: Map<string, Highlight>;
  changes: RevisionChange[];
};

function clone(chapters: StoryChapter[]): StoryChapter[] {
  return JSON.parse(JSON.stringify(chapters)) as StoryChapter[];
}

function highlightOf(ctx: Ctx, item: StoryItem): Highlight | undefined {
  return item.highlightId ? ctx.byId.get(item.highlightId) : undefined;
}

function itemLabel(ctx: Ctx, item: StoryItem): string {
  return item.type === "title-card" ? `title card "${item.title ?? ""}"` : `"${highlightOf(ctx, item)?.title ?? "clip"}"`;
}

function eachClip(ctx: Ctx, fn: (item: StoryItem, chapter: StoryChapter, index: number) => void): void {
  for (const chapter of ctx.chapters) {
    chapter.items.forEach((item, index) => {
      if (item.type === "highlight") fn(item, chapter, index);
    });
  }
}

function removeItems(ctx: Ctx, predicate: (item: StoryItem, chapter: StoryChapter) => boolean, reason: string, max = 99): number {
  let removed = 0;
  for (const chapter of ctx.chapters) {
    chapter.items = chapter.items.filter((item) => {
      if (removed >= max || item.type !== "highlight") return true;
      if (item.isLocked) return true;
      if (predicate(item, chapter)) {
        ctx.changes.push({ type: "removed", description: `Removed ${itemLabel(ctx, item)} — ${reason}` });
        removed++;
        return false;
      }
      return true;
    });
  }
  return removed;
}

function warnLocked(ctx: Ctx, items: StoryItem[], action: string): void {
  const locked = items.filter((i) => i.isLocked);
  if (locked.length > 0) {
    ctx.changes.push({
      type: "warning",
      description: `Left ${locked.length} locked clip${locked.length > 1 ? "s" : ""} unchanged while trying to ${action}.`,
    });
  }
}

type Handler = {
  test: RegExp;
  apply: (ctx: Ctx, notInStory: Highlight[]) => string | null;
};

const handlers: Handler[] = [
  {
    test: /\b(shorter|too long|tighten|trim it|cut it down)\b/i,
    apply(ctx) {
      let saved = 0;
      const optional: StoryItem[] = [];
      eachClip(ctx, (item) => {
        const h = highlightOf(ctx, item);
        if (h?.priority === "optional") optional.push(item);
      });
      warnLocked(ctx, optional, "shorten the video");
      removeItems(ctx, (item) => optional.includes(item), "it was marked optional");
      eachClip(ctx, (item) => {
        if (item.isLocked) return;
        const trimmed = Math.max(3, Math.round(item.durationSeconds * 0.9 * 10) / 10);
        saved += item.durationSeconds - trimmed;
        item.durationSeconds = trimmed;
      });
      if (saved > 0) ctx.changes.push({ type: "shortened", description: `Trimmed remaining clips by about ${Math.round(saved)} seconds in total.` });
      return `Shortened the story by removing optional clips and tightening the rest.`;
    },
  },
  {
    test: /\b(more early|early (riding|footage|moments|clips)|more of the beginning)\b/i,
    apply(ctx, notInStory) {
      const early = notInStory
        .filter((h) => h.status === "approved")
        .slice(0, 2);
      if (early.length === 0 && ctx.chapters.length === 0) return null;
      const first = ctx.chapters[0];
      for (const h of early) {
        first.items.push({
          id: crypto.randomUUID(),
          type: "highlight",
          highlightId: h.id,
          durationSeconds: Math.min(Math.max(h.endSeconds - h.startSeconds, 3), 12),
          transitionIn: "cut",
          narrativePurpose: "Shows the early days in more detail",
          musicPhase: "intro",
          isLocked: false,
        });
        ctx.changes.push({ type: "added", description: `Added "${h.title}" to ${first.title}.` });
      }
      let removedScenic = 0;
      for (const chapter of ctx.chapters.slice(2)) {
        chapter.items = chapter.items.filter((item) => {
          const h = highlightOf(ctx, item);
          if (removedScenic === 0 && h?.category === "scenic" && !item.isLocked && item.type === "highlight") {
            ctx.changes.push({ type: "removed", description: `Removed "${h.title}" to keep the total length steady.` });
            removedScenic++;
            return false;
          }
          return true;
        });
      }
      return "Added more early riding footage near the start of the story.";
    },
  },
  {
    test: /\b(stronger ending|better ending|strong final|end (stronger|better)|make the ending)\b/i,
    apply(ctx) {
      const last = ctx.chapters[ctx.chapters.length - 1];
      if (!last) return null;
      let best: { item: StoryItem; chapter: StoryChapter; score: number } | null = null;
      eachClip(ctx, (item, chapter) => {
        const h = highlightOf(ctx, item);
        if (!h || item.isLocked) return;
        const score = h.scores.progressionValue + h.scores.storyRelevance + h.scores.visualQuality;
        if (!best || score > best.score) best = { item, chapter, score };
      });
      if (best) {
        const b = best as { item: StoryItem; chapter: StoryChapter; score: number };
        b.chapter.items = b.chapter.items.filter((i) => i !== b.item);
        const closingIdx = last.items.findIndex((i) => i.type === "title-card");
        const insertAt = closingIdx === -1 ? last.items.length : closingIdx;
        b.item.durationSeconds = Math.round((b.item.durationSeconds + 3) * 10) / 10;
        b.item.musicPhase = "peak";
        last.items.splice(insertAt, 0, b.item);
        ctx.changes.push({ type: "moved", description: `Moved ${itemLabel(ctx, b.item)} to the end and lengthened it.` });
      }
      if (!last.items.some((i) => i.type === "title-card")) {
        last.items.push({
          id: crypto.randomUUID(),
          type: "title-card",
          title: "One ride at a time.",
          durationSeconds: 5,
          transitionIn: "fade",
          musicPhase: "outro",
          isLocked: false,
        });
        ctx.changes.push({ type: "added", description: "Added a closing title card." });
      }
      return "Rebuilt the ending around your strongest clip.";
    },
  },
  {
    test: /\b(energetic|more energy|faster|pick up the pace|punchier)\b/i,
    apply(ctx) {
      const middle = ctx.chapters.slice(1, Math.max(2, ctx.chapters.length - 1));
      let tightened = 0;
      for (const chapter of middle) {
        for (const item of chapter.items) {
          if (item.type !== "highlight" || item.isLocked) continue;
          item.durationSeconds = Math.max(3, Math.round(item.durationSeconds * 0.85 * 10) / 10);
          item.transitionIn = "cut";
          tightened++;
        }
      }
      if (tightened === 0) return null;
      ctx.changes.push({ type: "pacing", description: `Tightened ${tightened} clips in the middle of the story and switched them to clean cuts.` });
      return "Increased the energy through the middle of the story.";
    },
  },
  {
    test: /\b(fewer scenic|less scenic|too much scenery|fewer landscape)\b/i,
    apply(ctx) {
      let kept = false;
      const removed = removeItems(
        ctx,
        (item) => {
          const h = highlightOf(ctx, item);
          if (h?.category !== "scenic") return false;
          if (!kept) {
            kept = true;
            return false;
          }
          return true;
        },
        "keeping only the strongest scenic moment"
      );
      return removed > 0 ? "Reduced the scenic clips to the single strongest one." : null;
    },
  },
  {
    test: /\brain\b/i,
    apply(ctx) {
      if (ctx.chapters.length < 2) return null;
      let rainItem: StoryItem | null = null;
      let from: StoryChapter | null = null;
      eachClip(ctx, (item, chapter) => {
        const h = highlightOf(ctx, item);
        if (h && /rain/i.test(h.title) && !item.isLocked && !rainItem) {
          rainItem = item;
          from = chapter;
        }
      });
      if (!rainItem || !from) return null;
      const target = ctx.chapters[1];
      if (from === target) return null;
      (from as StoryChapter).items = (from as StoryChapter).items.filter((i) => i !== rainItem);
      target.items.splice(Math.min(1, target.items.length), 0, rainItem);
      ctx.changes.push({ type: "moved", description: `Moved the rainy ride into ${target.title}.` });
      return "Moved the rainy ride earlier in the story.";
    },
  },
  {
    test: /\b(more emotional|emotional)\b/i,
    apply(ctx) {
      const clips: { item: StoryItem; emotional: number }[] = [];
      eachClip(ctx, (item) => {
        const h = highlightOf(ctx, item);
        if (h && !item.isLocked) clips.push({ item, emotional: h.scores.emotionalValue });
      });
      clips.sort((a, b) => b.emotional - a.emotional);
      const top = clips.slice(0, 2);
      if (top.length === 0) return null;
      for (const { item } of top) {
        item.durationSeconds = Math.round((item.durationSeconds + 2) * 10) / 10;
        item.transitionIn = "dissolve";
        ctx.changes.push({ type: "extended", description: `Gave ${itemLabel(ctx, item)} more room to land.` });
      }
      return "Let the most emotional moments breathe a little longer.";
    },
  },
  {
    test: /\b(simplify|simpler|clean(er)? (cuts|transitions)|fewer transitions)\b/i,
    apply(ctx) {
      let changed = 0;
      ctx.chapters.forEach((chapter, ci) => {
        chapter.items.forEach((item, ii) => {
          const wanted = ci > 0 && ii === 0 ? "dissolve" : "cut";
          if (item.type === "highlight" && item.transitionIn !== wanted) {
            item.transitionIn = wanted;
            changed++;
          }
        });
      });
      if (changed === 0) return null;
      ctx.changes.push({ type: "transitions", description: `Simplified ${changed} transitions to clean cuts, keeping soft dissolves only between chapters.` });
      return "Simplified the transitions.";
    },
  },
  {
    test: /\b(repetitive|duplicate|similar clips|remove repeats)\b/i,
    apply(ctx) {
      const seen = new Set<string>();
      const removed = removeItems(
        ctx,
        (item) => {
          const h = highlightOf(ctx, item);
          if (!h) return false;
          const key = `${h.mediaItemId}:${h.category}`;
          if (seen.has(key)) return true;
          seen.add(key);
          return false;
        },
        "it repeated a moment already covered"
      );
      return removed > 0 ? "Removed clips that repeated moments already in the story." : null;
    },
  },
];

export const mockRevisionAssistant: RevisionAssistant = {
  propose(project, chapters, highlights, prompt): RevisionProposal {
    const ctx: Ctx = {
      chapters: clone(chapters),
      byId: new Map(highlights.map((h) => [h.id, h])),
      changes: [],
    };
    const inStory = new Set<string>();
    for (const c of chapters) for (const i of c.items) if (i.highlightId) inStory.add(i.highlightId);
    const notInStory = highlights.filter((h) => h.status === "approved" && !inStory.has(h.id));

    let summary: string | null = null;
    for (const handler of handlers) {
      if (handler.test.test(prompt)) {
        summary = handler.apply(ctx, notInStory);
        if (summary) break;
        ctx.changes.length = 0;
      }
    }

    if (!summary) {
      // Believable fallback: tighten the longest clips and rebalance slightly.
      const clips: StoryItem[] = [];
      eachClip(ctx, (item) => {
        if (!item.isLocked) clips.push(item);
      });
      clips.sort((a, b) => b.durationSeconds - a.durationSeconds);
      for (const item of clips.slice(0, 2)) {
        const before = item.durationSeconds;
        item.durationSeconds = Math.max(3, Math.round(item.durationSeconds * 0.85 * 10) / 10);
        ctx.changes.push({
          type: "adjusted",
          description: `Tightened ${itemLabel(ctx, item)} from ${before}s to ${item.durationSeconds}s.`,
        });
      }
      summary = `Adjusted the cut with your note in mind: "${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}"`;
    }

    if (ctx.changes.length === 0) {
      ctx.changes.push({ type: "note", description: "No clips needed to change for this request." });
    }
    return { summary, changes: ctx.changes, proposedChapters: ctx.chapters };
  },
};
