import type {
  HighlightCategory,
  MusicPhase,
  PlanSectionKey,
  PostProductionSettings,
  ProjectStage,
  StoryType,
  TransitionType,
} from "./types.js";

export const PROJECT_STAGES: { id: ProjectStage; label: string }[] = [
  { id: "media", label: "Media" },
  { id: "brief", label: "Creative brief" },
  { id: "plan", label: "Production plan" },
  { id: "highlights", label: "Highlights" },
  { id: "story", label: "Story" },
  { id: "first-cut", label: "First cut" },
  { id: "finish", label: "Finish" },
];

export function stageIndex(stage: ProjectStage): number {
  return PROJECT_STAGES.findIndex((s) => s.id === stage);
}

export const STORY_TYPES: { id: StoryType; label: string; blurb: string }[] = [
  { id: "progression", label: "Progression story", blurb: "A journey from beginner to confident — learning, training, growing." },
  { id: "travel", label: "Travel recap", blurb: "A trip worth remembering, from departure to the way home." },
  { id: "year-in-review", label: "Year in review", blurb: "Twelve months of moments, gathered into one film." },
  { id: "event", label: "Event", blurb: "A single day that mattered — parties, ceremonies, reunions." },
  { id: "family", label: "Family memories", blurb: "The everyday moments that quietly become the big ones." },
  { id: "sports", label: "Sports highlights", blurb: "Best plays, big games, and the season's story." },
  { id: "tribute", label: "Tribute", blurb: "A film that celebrates someone who matters." },
  { id: "custom", label: "Custom", blurb: "Start from a blank creative brief and shape it your way." },
];

export const HIGHLIGHT_CATEGORIES: { id: HighlightCategory; label: string }[] = [
  { id: "beginning", label: "Beginning" },
  { id: "learning", label: "Learning" },
  { id: "milestone", label: "Milestone" },
  { id: "progress", label: "Progress" },
  { id: "scenic", label: "Scenic" },
  { id: "funny", label: "Funny" },
  { id: "challenge", label: "Challenge" },
  { id: "celebration", label: "Celebration" },
  { id: "strong-finish", label: "Strong finish" },
  { id: "uncategorized", label: "Uncategorized" },
];

export function categoryLabel(id: HighlightCategory): string {
  return HIGHLIGHT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const TONES = [
  "Uplifting",
  "Reflective",
  "Energetic",
  "Funny",
  "Emotional",
  "Cinematic",
  "Natural",
] as const;

export const STRUCTURES = [
  "Chronological",
  "Theme-based",
  "Before and after",
  "Milestone journey",
  "Fast-paced montage",
  "Documentary",
] as const;

export const AUDIENCES = [
  "Personal",
  "Friends and family",
  "Social media",
  "Public",
  "Professional",
] as const;

export const LENGTH_OPTIONS: { label: string; seconds: number }[] = [
  { label: "60 seconds", seconds: 60 },
  { label: "2–3 minutes", seconds: 150 },
  { label: "4–5 minutes", seconds: 270 },
  { label: "8–10 minutes", seconds: 540 },
];

export const TRANSITION_TYPES: { id: TransitionType; label: string }[] = [
  { id: "cut", label: "Cut" },
  { id: "dissolve", label: "Dissolve" },
  { id: "fade", label: "Fade" },
  { id: "dip-to-black", label: "Dip to black" },
  { id: "match-movement", label: "Match movement" },
];

export const TRANSITION_PRESETS = ["Clean cuts", "Subtle", "Energetic", "Cinematic", "Custom"] as const;

export const STYLE_PRESETS = [
  "Natural",
  "Documentary",
  "Cinematic",
  "Bright",
  "Warm",
  "Vintage",
  "Black and white",
] as const;

export const MUSIC_MOODS = [
  "Uplifting",
  "Reflective",
  "Energetic",
  "Cinematic",
  "Playful",
  "Minimal",
  "No music",
] as const;

export type MusicTrack = {
  id: string;
  title: string;
  durationSeconds: number;
  mood: string;
  /** Normalized energy curve (0–1) used to draw a small sparkline. */
  energy: number[];
  licensed: boolean;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "new-roads", title: "New Roads", durationSeconds: 161, mood: "Uplifting", energy: [0.2, 0.3, 0.4, 0.55, 0.65, 0.8, 0.9, 0.7], licensed: true },
  { id: "open-sky", title: "Open Sky", durationSeconds: 185, mood: "Reflective", energy: [0.3, 0.35, 0.4, 0.5, 0.45, 0.55, 0.5, 0.4], licensed: true },
  { id: "forward-motion", title: "Forward Motion", durationSeconds: 178, mood: "Energetic", energy: [0.4, 0.55, 0.7, 0.75, 0.85, 0.9, 0.95, 0.85], licensed: true },
  { id: "small-victories", title: "Small Victories", durationSeconds: 202, mood: "Playful", energy: [0.35, 0.5, 0.4, 0.6, 0.5, 0.7, 0.6, 0.5], licensed: true },
  { id: "sunday-ride", title: "Sunday Ride", durationSeconds: 156, mood: "Warm", energy: [0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.55, 0.45], licensed: true },
];

export const MUSIC_PHASES: { id: MusicPhase; label: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "build", label: "Build" },
  { id: "steady", label: "Steady" },
  { id: "peak", label: "Peak" },
  { id: "outro", label: "Outro" },
];

export const PLAN_SECTION_META: { key: PlanSectionKey; title: string }[] = [
  { key: "projectGoal", title: "Project goal" },
  { key: "highlightInstructions", title: "Highlight selection" },
  { key: "storyInstructions", title: "Story building" },
  { key: "musicInstructions", title: "Music and sound" },
  { key: "visualInstructions", title: "Visual treatment" },
  { key: "transitionInstructions", title: "Transitions and pacing" },
  { key: "titleInstructions", title: "Titles and text" },
  { key: "exportInstructions", title: "Export plan" },
];

export const ANALYSIS_PHASES = [
  "Preparing videos",
  "Detecting scenes",
  "Reviewing moments",
  "Comparing similar clips",
  "Matching clips to your brief",
  "Creating highlight suggestions",
];

export const EXPORT_PHASES = [
  "Preparing final timeline",
  "Processing video",
  "Mixing audio",
  "Adding titles",
  "Encoding final video",
  "Finalizing download",
];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
];

export function defaultPostProduction(): PostProductionSettings {
  return {
    music: {
      mood: "Uplifting",
      trackId: "new-roads",
      volume: 70,
      preserveNaturalAudio: true,
      duckUnderSpeech: true,
      syncCutsToMusic: false,
      fadeIn: true,
      fadeOut: true,
    },
    style: {
      preset: "Natural",
      stabilization: true,
      colorCorrection: true,
      exposureMatching: true,
      slowMotion: false,
      horizonLeveling: false,
      cropBehavior: "fit",
      grain: 0,
      vignette: 0,
    },
    transitions: {
      preset: "Clean cuts",
      defaultTransition: "cut",
    },
    titles: {
      openingTitle: "",
      openingSubtitle: "",
      showDates: true,
      showLocations: false,
      showMilestones: true,
      chapterCards: false,
      closingMessage: "",
    },
    watermark: {
      mode: "none",
      text: "",
      position: "bottom-right",
      opacity: 60,
      size: "small",
    },
  };
}
