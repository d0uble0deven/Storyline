/** Storyline domain model — shared between the web app and the API. */

export type StoryType =
  | "progression"
  | "travel"
  | "year-in-review"
  | "event"
  | "family"
  | "sports"
  | "tribute"
  | "custom";

export type ProjectStatus = "draft" | "in-progress" | "complete";

export type ProjectStage =
  | "media"
  | "brief"
  | "plan"
  | "highlights"
  | "story"
  | "first-cut"
  | "finish";

export type MediaSource = "upload" | "google-photos" | "google-drive" | "dropbox" | "sample";

export type MediaStatus =
  | "uploading"
  | "processing"
  | "ready"
  | "analyzed"
  | "needs-attention"
  | "failed";

export type HighlightStatus = "suggested" | "approved" | "rejected";

export type HighlightPriority = "essential" | "normal" | "optional";

export type HighlightCategory =
  | "beginning"
  | "learning"
  | "milestone"
  | "progress"
  | "scenic"
  | "funny"
  | "challenge"
  | "celebration"
  | "strong-finish"
  | "uncategorized";

export type TransitionType = "cut" | "dissolve" | "fade" | "dip-to-black" | "match-movement";

export type MusicPhase = "intro" | "build" | "steady" | "peak" | "outro";

export type CreativeBrief = {
  overview: string;
  targetDurationSeconds?: number;
  audience?: string;
  tones: string[];
  structure?: string;
  ending?: string;
  title?: string;
};

export type PlanSection = {
  value: string;
  originalAiValue: string;
  isLocked: boolean;
  isUserEdited: boolean;
};

export type PlanSectionKey =
  | "projectGoal"
  | "highlightInstructions"
  | "storyInstructions"
  | "musicInstructions"
  | "visualInstructions"
  | "transitionInstructions"
  | "titleInstructions"
  | "exportInstructions";

export type ProductionPlan = Record<PlanSectionKey, PlanSection>;

export type HighlightScores = {
  visualQuality: number;
  storyRelevance: number;
  emotionalValue: number;
  progressionValue: number;
  uniqueness: number;
};

export type Highlight = {
  id: string;
  projectId: string;
  mediaItemId: string;
  title: string;
  description: string;
  category: HighlightCategory;
  startSeconds: number;
  endSeconds: number;
  /** The span the AI originally suggested, kept so trims can be restored. */
  aiStartSeconds: number;
  aiEndSeconds: number;
  status: HighlightStatus;
  priority: HighlightPriority;
  isFavorite: boolean;
  userNote?: string;
  scores: HighlightScores;
  aiReasoning: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaItem = {
  id: string;
  projectId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  source: MediaSource;
  storagePath?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  durationSeconds?: number;
  recordedAt?: string;
  uploadedAt: string;
  width?: number;
  height?: number;
  status: MediaStatus;
  notes?: string;
  isImportant: boolean;
};

export type StoryItem = {
  id: string;
  type: "highlight" | "title-card";
  highlightId?: string;
  title?: string;
  subtitle?: string;
  durationSeconds: number;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  narrativePurpose?: string;
  musicPhase?: MusicPhase;
  isLocked: boolean;
};

export type StoryChapter = {
  id: string;
  title: string;
  description?: string;
  order: number;
  items: StoryItem[];
};

export type Story = {
  projectId: string;
  chapters: StoryChapter[];
  canUndo: boolean;
  canRedo: boolean;
  updatedAt: string;
};

export type RevisionChange = {
  type: string;
  description: string;
};

export type Revision = {
  id: string;
  projectId: string;
  prompt: string;
  summary: string;
  changes: RevisionChange[];
  proposedChapters?: StoryChapter[];
  status: "proposed" | "applied" | "rejected";
  createdAt: string;
};

export type MusicSettings = {
  mood: string;
  trackId: string | null;
  volume: number;
  preserveNaturalAudio: boolean;
  duckUnderSpeech: boolean;
  syncCutsToMusic: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
};

export type StyleSettings = {
  preset: string;
  stabilization: boolean;
  colorCorrection: boolean;
  exposureMatching: boolean;
  slowMotion: boolean;
  horizonLeveling: boolean;
  cropBehavior: "fit" | "fill";
  grain: number;
  vignette: number;
};

export type TransitionSettings = {
  preset: string;
  defaultTransition: TransitionType;
};

export type TitleSettings = {
  openingTitle: string;
  openingSubtitle: string;
  showDates: boolean;
  showLocations: boolean;
  showMilestones: boolean;
  chapterCards: boolean;
  closingMessage: string;
};

export type WatermarkSettings = {
  mode: "none" | "storyline" | "custom-text" | "custom-logo";
  text: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  opacity: number;
  size: "small" | "medium" | "large";
};

export type PostProductionSettings = {
  music: MusicSettings;
  style: StyleSettings;
  transitions: TransitionSettings;
  titles: TitleSettings;
  watermark: WatermarkSettings;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  storyType: StoryType;
  status: ProjectStatus;
  currentStage: ProjectStage;
  creativeBrief?: CreativeBrief;
  productionPlan?: ProductionPlan;
  postProduction: PostProductionSettings;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStats = {
  mediaCount: number;
  totalHighlights: number;
  approved: number;
  rejected: number;
  suggested: number;
  essential: number;
  approvedDurationSeconds: number;
};

export type ProjectSummary = Project & {
  stats: ProjectStats;
  progressPercent: number;
};

export type JobType = "analysis" | "export";

export type JobStatus = "queued" | "running" | "complete" | "failed";

export type JobFinding = {
  at: string;
  message: string;
};

export type ExportConfig = {
  aspect: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  format: "mp4";
};

export type ExportResult = {
  downloadUrl: string;
  fileSizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  completedAt: string;
};

export type Job = {
  id: string;
  projectId: string;
  type: JobType;
  status: JobStatus;
  phases: string[];
  phaseIndex: number;
  progress: number;
  findings: JobFinding[];
  payload?: ExportConfig | Record<string, never>;
  result?: ExportResult | null;
  createdAt: string;
  updatedAt: string;
};

/** Structured render plan — stored and displayed in the MVP, executed by a real engine later. */
export type RenderClip = {
  storyItemId: string;
  mediaItemId?: string;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  timelineStartSeconds: number;
  transitionIn?: TransitionType;
  speed: number;
  audioGain: number;
};

export type RenderPlan = {
  width: number;
  height: number;
  frameRate: number;
  format: "mp4";
  totalDurationSeconds: number;
  clips: RenderClip[];
  music: MusicSettings;
  titles: TitleSettings;
  watermark?: WatermarkSettings;
};
