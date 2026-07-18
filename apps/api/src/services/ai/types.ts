import type {
  CreativeBrief,
  Highlight,
  PlanSectionKey,
  ProductionPlan,
  Project,
  RevisionChange,
  StoryChapter,
} from "@storyline/shared";
import type { HighlightDraft } from "../../repositories/highlights.js";

/**
 * The four AI stages of Storyline. The MVP ships deterministic mock
 * implementations; real model-backed implementations replace these
 * behind the same interfaces without touching routes or the UI.
 */

/** Stage 1 — Creative producer: brief → structured production plan. */
export interface CreativeProducer {
  generatePlan(project: Project, brief: CreativeBrief): ProductionPlan;
  regenerateSection(
    project: Project,
    brief: CreativeBrief,
    plan: ProductionPlan,
    key: PlanSectionKey
  ): string;
}

/** Stage 2 — Highlight curator: media library → candidate highlights. */
export interface HighlightCurator {
  /** Returns highlight drafts plus optional seed-review metadata for the demo project. */
  analyzeProject(projectId: string): CuratedHighlight[];
  findingsFor(projectId: string): string[];
}

export type CuratedHighlight = HighlightDraft & {
  seedStatus?: "approved" | "rejected" | "suggested";
  seedPriority?: "essential" | "normal" | "optional";
  seedFavorite?: boolean;
  seedNote?: string;
};

/** Stage 3 — Story editor: approved highlights → chaptered first cut. */
export interface StoryEditor {
  generateStory(project: Project, highlights: Highlight[]): StoryChapter[];
  regenerateChapter(
    project: Project,
    highlights: Highlight[],
    chapters: StoryChapter[],
    chapterId: string
  ): StoryChapter[];
}

/** Stage 4 — Revision assistant: natural-language prompt → proposed structural changes. */
export interface RevisionAssistant {
  propose(
    project: Project,
    chapters: StoryChapter[],
    highlights: Highlight[],
    prompt: string
  ): RevisionProposal;
}

export type RevisionProposal = {
  summary: string;
  changes: RevisionChange[];
  proposedChapters: StoryChapter[];
};
