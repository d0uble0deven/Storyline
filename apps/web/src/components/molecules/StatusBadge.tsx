import type { HighlightStatus, JobStatus, MediaStatus, ProjectStage } from "@storyline/shared";
import { PROJECT_STAGES } from "@storyline/shared";
import { Badge } from "../atoms/Badge.js";

const MEDIA_TONES: Record<MediaStatus, { tone: "neutral" | "ok" | "warn" | "danger" | "info"; label: string }> = {
  uploading: { tone: "info", label: "Uploading" },
  processing: { tone: "info", label: "Processing" },
  ready: { tone: "neutral", label: "Ready" },
  analyzed: { tone: "ok", label: "Analyzed" },
  "needs-attention": { tone: "warn", label: "Needs attention" },
  failed: { tone: "danger", label: "Failed" },
};

export function MediaStatusBadge({ status }: { status: MediaStatus }) {
  const { tone, label } = MEDIA_TONES[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const HIGHLIGHT_TONES: Record<HighlightStatus, { tone: "neutral" | "ok" | "danger"; label: string }> = {
  suggested: { tone: "neutral", label: "Needs review" },
  approved: { tone: "ok", label: "Approved" },
  rejected: { tone: "danger", label: "Rejected" },
};

export function HighlightStatusBadge({ status }: { status: HighlightStatus }) {
  const { tone, label } = HIGHLIGHT_TONES[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function StageBadge({ stage }: { stage: ProjectStage }) {
  const label = PROJECT_STAGES.find((s) => s.id === stage)?.label ?? stage;
  return <Badge tone="accent">{label}</Badge>;
}

const JOB_TONES: Record<JobStatus, { tone: "neutral" | "info" | "ok" | "danger"; label: string }> = {
  queued: { tone: "neutral", label: "Queued" },
  running: { tone: "info", label: "In progress" },
  complete: { tone: "ok", label: "Complete" },
  failed: { tone: "danger", label: "Failed" },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { tone, label } = JOB_TONES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
