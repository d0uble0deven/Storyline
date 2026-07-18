import type {
  Highlight,
  HighlightCategory,
  MusicPhase,
  Project,
  StoryChapter,
  StoryItem,
} from "@storyline/shared";
import { newId } from "../../db/db.js";
import { listMedia } from "../../repositories/media.js";
import type { StoryEditor } from "./types.js";

const PROGRESSION_CHAPTERS = [
  { title: "Starting Out", description: "Where the year began: short attempts and long odds." },
  { title: "Finding Balance", description: "The first real rides, one small win at a time." },
  { title: "Going Further", description: "New places, worse weather, longer distances." },
  { title: "Riding with Confidence", description: "The rider the year was building toward." },
];

const GENERIC_CHAPTERS = [
  { title: "The Opening", description: "Setting the scene." },
  { title: "The Journey", description: "The story builds." },
  { title: "The Turn", description: "Things change." },
  { title: "The Finish", description: "Where it all lands." },
];

const PURPOSE_BY_CATEGORY: Record<HighlightCategory, string> = {
  beginning: "Sets the starting point",
  learning: "Shows the work it took",
  milestone: "Marks a turning point",
  progress: "Shows how far they've come",
  scenic: "Gives the story room to breathe",
  funny: "Keeps it human",
  challenge: "Raises the stakes",
  celebration: "Rewards the effort",
  "strong-finish": "Lands the ending",
  uncategorized: "Supports the story",
};

const PHASE_BY_CHAPTER: MusicPhase[] = ["intro", "build", "steady", "peak"];

function clipDuration(h: Highlight): number {
  const raw = h.endSeconds - h.startSeconds;
  const cap = h.priority === "essential" ? 18 : 14;
  return Math.round(Math.min(Math.max(raw, 3), cap) * 10) / 10;
}

function highlightItem(h: Highlight, chapterIdx: number, isFirstInChapter: boolean): StoryItem {
  return {
    id: newId(),
    type: "highlight",
    highlightId: h.id,
    durationSeconds: clipDuration(h),
    transitionIn: chapterIdx > 0 && isFirstInChapter ? "dissolve" : "cut",
    narrativePurpose: PURPOSE_BY_CATEGORY[h.category],
    musicPhase: PHASE_BY_CHAPTER[Math.min(chapterIdx, PHASE_BY_CHAPTER.length - 1)],
    isLocked: false,
  };
}

function buildChapters(project: Project, approved: Highlight[], sortKey: (h: Highlight) => number): StoryChapter[] {
  const meta = project.storyType === "progression" ? PROGRESSION_CHAPTERS : GENERIC_CHAPTERS;
  const sorted = [...approved].sort((a, b) => sortKey(a) - sortKey(b));
  const perChapter = Math.max(1, Math.ceil(sorted.length / meta.length));
  const chapters: StoryChapter[] = meta.map((m, i) => ({
    id: newId(),
    title: m.title,
    description: m.description,
    order: i,
    items: sorted.slice(i * perChapter, (i + 1) * perChapter).map((h, j) => highlightItem(h, i, j === 0)),
  }));

  // Opening title card.
  const openingTitle = project.creativeBrief?.title || project.name;
  const year = new Date().getFullYear().toString();
  chapters[0].items.unshift({
    id: newId(),
    type: "title-card",
    title: openingTitle,
    subtitle: year,
    durationSeconds: 4,
    transitionOut: "dissolve",
    musicPhase: "intro",
    isLocked: false,
  });

  // Closing title card.
  const closing = project.creativeBrief?.ending || "One ride at a time.";
  const last = chapters[chapters.length - 1];
  last.items.push({
    id: newId(),
    type: "title-card",
    title: closing,
    durationSeconds: 5,
    transitionIn: "fade",
    musicPhase: "outro",
    isLocked: false,
  });

  return chapters.filter((c) => c.items.length > 0).map((c, i) => ({ ...c, order: i }));
}

function mediaDateKey(project: Project): (h: Highlight) => number {
  const media = listMedia(project.id);
  const dates = new Map(media.map((m) => [m.id, m.recordedAt ? Date.parse(m.recordedAt) : 0]));
  return (h) => (dates.get(h.mediaItemId) ?? 0) + h.startSeconds;
}

export const mockStoryEditor: StoryEditor = {
  generateStory(project, highlights) {
    const approved = highlights.filter((h) => h.status === "approved");
    return buildChapters(project, approved, mediaDateKey(project));
  },

  regenerateChapter(project, highlights, chapters, chapterId) {
    // Rebuild one chapter with a different (score-led) ordering of the same clips.
    const target = chapters.find((c) => c.id === chapterId);
    if (!target) return chapters;
    const byId = new Map(highlights.map((h) => [h.id, h]));
    const clips = target.items.filter((i) => i.type === "highlight");
    const cards = target.items.filter((i) => i.type === "title-card");
    const reordered = [...clips].sort((a, b) => {
      const ha = a.highlightId ? byId.get(a.highlightId) : undefined;
      const hb = b.highlightId ? byId.get(b.highlightId) : undefined;
      const scoreA = ha ? ha.scores.storyRelevance + ha.scores.emotionalValue : 0;
      const scoreB = hb ? hb.scores.storyRelevance + hb.scores.emotionalValue : 0;
      return scoreB - scoreA;
    });
    const isFirstChapter = chapters[0]?.id === chapterId;
    const isLastChapter = chapters[chapters.length - 1]?.id === chapterId;
    const items: StoryItem[] = [];
    if (isFirstChapter && cards.length > 0) items.push(cards[0]);
    items.push(...reordered);
    if (isLastChapter) items.push(...cards.filter((c) => !items.includes(c)));
    return chapters.map((c) => (c.id === chapterId ? { ...c, items } : c));
  },
};

export function storyDurationSeconds(chapters: StoryChapter[]): number {
  return Math.round(
    chapters.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.durationSeconds, 0), 0)
  );
}
