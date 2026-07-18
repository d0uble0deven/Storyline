import { z } from "zod";

const storyType = z.enum([
  "progression",
  "travel",
  "year-in-review",
  "event",
  "family",
  "sports",
  "tribute",
  "custom",
]);

const projectStage = z.enum(["media", "brief", "plan", "highlights", "story", "first-cut", "finish"]);

const highlightStatus = z.enum(["suggested", "approved", "rejected"]);
const highlightPriority = z.enum(["essential", "normal", "optional"]);
const highlightCategory = z.enum([
  "beginning",
  "learning",
  "milestone",
  "progress",
  "scenic",
  "funny",
  "challenge",
  "celebration",
  "strong-finish",
  "uncategorized",
]);

const transitionType = z.enum(["cut", "dissolve", "fade", "dip-to-black", "match-movement"]);
const musicPhase = z.enum(["intro", "build", "steady", "peak", "outro"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Give your project a name").max(120),
  description: z.string().trim().max(600).optional(),
  storyType,
  useTemplate: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(600).optional(),
  storyType: storyType.optional(),
  currentStage: projectStage.optional(),
  coverUrl: z.string().max(500).optional(),
});

export const briefSchema = z.object({
  overview: z.string().trim().max(4000),
  targetDurationSeconds: z.number().int().min(15).max(3600).optional(),
  audience: z.string().max(60).optional(),
  tones: z.array(z.string().max(40)).max(7).default([]),
  structure: z.string().max(60).optional(),
  ending: z.string().max(300).optional(),
  title: z.string().max(120).optional(),
});

export const planSectionKeySchema = z.enum([
  "projectGoal",
  "highlightInstructions",
  "storyInstructions",
  "musicInstructions",
  "visualInstructions",
  "transitionInstructions",
  "titleInstructions",
  "exportInstructions",
]);

export const planPatchSchema = z.object({
  sections: z
    .array(
      z.object({
        key: planSectionKeySchema,
        value: z.string().max(4000).optional(),
        isLocked: z.boolean().optional(),
        resetToAi: z.boolean().optional(),
      })
    )
    .min(1),
});

export const planGenerateSchema = z.object({
  section: planSectionKeySchema.optional(),
  mode: z.enum(["all", "unlocked", "section"]).default("all"),
});

export const mediaPatchSchema = z.object({
  notes: z.string().max(1000).optional(),
  isImportant: z.boolean().optional(),
  recordedAt: z.string().optional(),
});

export const highlightPatchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  status: highlightStatus.optional(),
  priority: highlightPriority.optional(),
  category: highlightCategory.optional(),
  isFavorite: z.boolean().optional(),
  userNote: z.string().max(600).optional(),
  startSeconds: z.number().min(0).optional(),
  endSeconds: z.number().min(0).optional(),
  restoreAiTrim: z.boolean().optional(),
});

export const bulkHighlightSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  patch: z.object({
    status: highlightStatus.optional(),
    priority: highlightPriority.optional(),
    category: highlightCategory.optional(),
  }),
});

const storyItemSchema = z.object({
  id: z.string(),
  type: z.enum(["highlight", "title-card"]),
  highlightId: z.string().optional(),
  title: z.string().max(160).optional(),
  subtitle: z.string().max(200).optional(),
  durationSeconds: z.number().min(0.5).max(600),
  transitionIn: transitionType.optional(),
  transitionOut: transitionType.optional(),
  narrativePurpose: z.string().max(300).optional(),
  musicPhase: musicPhase.optional(),
  isLocked: z.boolean(),
});

const storyChapterSchema = z.object({
  id: z.string(),
  title: z.string().max(160),
  description: z.string().max(400).optional(),
  order: z.number().int().min(0),
  items: z.array(storyItemSchema),
});

export const storyPatchSchema = z.object({
  chapters: z.array(storyChapterSchema),
  /** When true the previous story is not pushed onto the undo stack (drag previews). */
  transient: z.boolean().optional(),
});

export const revisionCreateSchema = z.object({
  prompt: z.string().trim().min(3, "Tell Storyline what you'd like to change").max(1000),
});

export const revisionPatchSchema = z.object({
  status: z.enum(["applied", "rejected"]),
});

export const postProductionSchema = z.object({
  music: z.object({
    mood: z.string().max(40),
    trackId: z.string().max(60).nullable(),
    volume: z.number().min(0).max(100),
    preserveNaturalAudio: z.boolean(),
    duckUnderSpeech: z.boolean(),
    syncCutsToMusic: z.boolean(),
    fadeIn: z.boolean(),
    fadeOut: z.boolean(),
  }),
  style: z.object({
    preset: z.string().max(40),
    stabilization: z.boolean(),
    colorCorrection: z.boolean(),
    exposureMatching: z.boolean(),
    slowMotion: z.boolean(),
    horizonLeveling: z.boolean(),
    cropBehavior: z.enum(["fit", "fill"]),
    grain: z.number().min(0).max(100),
    vignette: z.number().min(0).max(100),
  }),
  transitions: z.object({
    preset: z.string().max(40),
    defaultTransition: transitionType,
  }),
  titles: z.object({
    openingTitle: z.string().max(120),
    openingSubtitle: z.string().max(160),
    showDates: z.boolean(),
    showLocations: z.boolean(),
    showMilestones: z.boolean(),
    chapterCards: z.boolean(),
    closingMessage: z.string().max(200),
  }),
  watermark: z.object({
    mode: z.enum(["none", "storyline", "custom-text", "custom-logo"]),
    text: z.string().max(60),
    position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
    opacity: z.number().min(0).max(100),
    size: z.enum(["small", "medium", "large"]),
  }),
});

export const exportRequestSchema = z.object({
  aspect: z.enum(["16:9", "9:16", "1:1"]),
  resolution: z.enum(["720p", "1080p", "4k"]),
  format: z.literal("mp4"),
});
