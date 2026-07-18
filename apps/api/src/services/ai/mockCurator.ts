import type { HighlightCategory } from "@storyline/shared";
import { listMedia } from "../../repositories/media.js";
import { highlightsForMedia } from "../../repositories/highlights.js";
import {
  bikeAnalysisFindings,
  bikeHighlights,
  bikeMedia,
  genericAnalysisFindings,
} from "../../demo/bikeStory.js";
import type { CuratedHighlight, HighlightCurator } from "./types.js";

/** Small deterministic hash so generic highlights get stable, believable scores. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const genericTitles: { title: string; category: HighlightCategory; reasoning: string }[] = [
  { title: "A strong opening moment", category: "beginning", reasoning: "Clear action near the start of the clip makes this a natural way in." },
  { title: "A moment worth keeping", category: "progress", reasoning: "Steady footage with clear subject focus and good energy." },
  { title: "A scenic breather", category: "scenic", reasoning: "Wide, calm framing that gives the story room to breathe." },
  { title: "An unexpected laugh", category: "funny", reasoning: "A spontaneous reaction that reads clearly on camera." },
  { title: "A small victory", category: "celebration", reasoning: "A visible payoff moment with genuine emotion." },
];

export const mockCurator: HighlightCurator = {
  analyzeProject(projectId) {
    const media = listMedia(projectId);
    const results: CuratedHighlight[] = [];

    for (const item of media) {
      // Skip media that already has highlights so re-running analysis is safe.
      if (highlightsForMedia(item.id).length > 0) continue;

      const spec = bikeMedia.find((m) => m.filename === item.originalFilename);
      if (spec) {
        for (const t of bikeHighlights.filter((h) => h.mediaKey === spec.key)) {
          results.push({
            projectId,
            mediaItemId: item.id,
            title: t.title,
            description: t.description,
            category: t.category,
            startSeconds: t.start,
            endSeconds: t.end,
            scores: t.scores,
            aiReasoning: t.reasoning,
            seedStatus: t.seedStatus,
            seedPriority: t.seedPriority,
            seedFavorite: t.seedFavorite,
            seedNote: t.seedNote,
          });
        }
        continue;
      }

      // Unknown footage: generate one or two plausible candidates per clip.
      const duration = item.durationSeconds ?? 60;
      const seed = hash(item.id);
      const count = duration > 90 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const g = genericTitles[(seed + i) % genericTitles.length];
        const start = Math.min(Math.round((duration * (0.15 + 0.3 * i) + (seed % 7)) * 10) / 10, Math.max(0, duration - 8));
        const length = 6 + ((seed >> (i + 2)) % 8);
        const base = 5 + (seed % 4);
        results.push({
          projectId,
          mediaItemId: item.id,
          title: g.title,
          description: `A candidate moment from ${item.originalFilename}, selected for review.`,
          category: g.category,
          startSeconds: start,
          endSeconds: Math.min(start + length, duration),
          scores: {
            visualQuality: Math.min(10, base + (i === 0 ? 1 : 0)),
            storyRelevance: Math.min(10, base + ((seed >> 3) % 3)),
            emotionalValue: Math.min(10, 4 + ((seed >> 5) % 5)),
            progressionValue: Math.min(10, 4 + ((seed >> 7) % 5)),
            uniqueness: Math.min(10, 5 + ((seed >> 9) % 4)),
          },
          aiReasoning: g.reasoning,
        });
      }
    }
    return results;
  },

  findingsFor(projectId) {
    const media = listMedia(projectId);
    const isBike = media.some((m) => bikeMedia.some((b) => b.filename === m.originalFilename));
    return isBike ? bikeAnalysisFindings : genericAnalysisFindings;
  },
};
