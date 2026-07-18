import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Highlight, HighlightCategory, Job, MediaItem } from "@storyline/shared";
import { HIGHLIGHT_CATEGORIES } from "@storyline/shared";
import {
  useAnalysisStatus,
  useBulkHighlights,
  useGenerateStory,
  useHighlights,
  useMedia,
  usePatchHighlight,
  useStartAnalysis,
} from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Badge } from "../../components/atoms/Badge.js";
import { Select } from "../../components/atoms/Select.js";
import { Spinner } from "../../components/atoms/Spinner.js";
import { Progress } from "../../components/atoms/Progress.js";
import { Textarea } from "../../components/atoms/Textarea.js";
import { Modal } from "../../components/molecules/Modal.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { MediaThumbnail } from "../../components/molecules/MediaThumbnail.js";
import { HighlightCard } from "../../components/organisms/HighlightCard.js";
import { IconCheck, IconFilm } from "../../components/icons.js";
import { clamp, formatDuration, formatDurationLong, pluralize } from "../../lib/format.js";
import styles from "./Highlights.module.css";

/* ---------- Analysis progress ---------- */

function AnalysisProgress({ job }: { job: Job }) {
  return (
    <div className={styles.analysis}>
      <h2 className={styles.analysisTitle}>Finding your highlights</h2>
      <p className={styles.analysisHint}>
        Storyline is watching your footage with your brief in mind. You can leave this page — the work continues.
      </p>
      <Progress value={job.progress} label="Analysis progress" />
      <ol className={styles.phases}>
        {job.phases.map((phase, i) => (
          <li
            key={phase}
            className={`${styles.phase} ${i < job.phaseIndex ? styles.phaseDone : ""} ${i === job.phaseIndex ? styles.phaseActive : ""}`}
          >
            <span className={styles.phaseDot}>
              {i < job.phaseIndex ? <IconCheck size={10} /> : i === job.phaseIndex ? <Spinner size={11} /> : i + 1}
            </span>
            {phase}
          </li>
        ))}
      </ol>
      {job.findings.length > 0 && (
        <div className={styles.findings} aria-live="polite">
          <p className={styles.findingsTitle}>Along the way</p>
          <ul>
            {job.findings.map((f, i) => (
              <li key={i}>{f.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Trim modal ---------- */

function TrimModal({
  highlight,
  media,
  onClose,
  onSave,
}: {
  highlight: Highlight;
  media?: MediaItem;
  onClose: () => void;
  onSave: (patch: { startSeconds: number; endSeconds: number; userNote?: string; restoreAiTrim?: boolean }) => void;
}) {
  const total = media?.durationSeconds ?? Math.max(highlight.endSeconds + 10, 60);
  const [start, setStart] = useState(highlight.startSeconds);
  const [end, setEnd] = useState(highlight.endSeconds);
  const [note, setNote] = useState(highlight.userNote ?? "");
  const suggested = highlight.aiEndSeconds - highlight.aiStartSeconds;

  return (
    <Modal open onClose={onClose} title={`Trim “${highlight.title}”`} width={620}>
      <div className={styles.trim}>
        <MediaThumbnail
          thumbnailUrl={media?.thumbnailUrl}
          alt={highlight.title}
          timeRange={[start, end]}
          size="lg"
        />
        <div className={styles.filmstrip} aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={styles.frame}
              style={media?.thumbnailUrl ? { backgroundImage: `url(${media.thumbnailUrl})` } : undefined}
            />
          ))}
          <span
            className={styles.trimRange}
            style={{ left: `${(start / total) * 100}%`, width: `${((end - start) / total) * 100}%` }}
          />
        </div>
        <div className={styles.trimSliders}>
          <label className={styles.trimLabel}>
            Start — {formatDuration(start)}
            <input
              type="range"
              min={0}
              max={total}
              step={0.5}
              value={start}
              onChange={(e) => setStart(clamp(Number(e.target.value), 0, end - 1))}
            />
          </label>
          <label className={styles.trimLabel}>
            End — {formatDuration(end)}
            <input
              type="range"
              min={0}
              max={total}
              step={0.5}
              value={end}
              onChange={(e) => setEnd(clamp(Number(e.target.value), start + 1, total))}
            />
          </label>
        </div>
        <p className={styles.trimMeta}>
          Current length <strong>{formatDuration(end - start)}</strong> · Storyline suggested{" "}
          {formatDuration(suggested)}
        </p>
        <Textarea
          value={note}
          rows={2}
          placeholder="Add a note — e.g. “This was my first ride without putting my foot down.”"
          aria-label="Note for this highlight"
          onChange={(e) => setNote(e.target.value)}
        />
        <div className={styles.trimActions}>
          <Button
            variant="ghost"
            onClick={() => {
              setStart(highlight.aiStartSeconds);
              setEnd(highlight.aiEndSeconds);
            }}
          >
            Restore AI selection
          </Button>
          <div className={styles.trimActionsRight}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => onSave({ startSeconds: start, endSeconds: end, userNote: note.trim() || undefined })}
            >
              Save trim
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Summary panel ---------- */

const COVERAGE_GROUPS: { label: string; categories: HighlightCategory[] }[] = [
  { label: "Beginning", categories: ["beginning"] },
  { label: "Early progress", categories: ["learning"] },
  { label: "Middle period", categories: ["progress", "challenge", "funny", "scenic"] },
  { label: "Milestones", categories: ["milestone"] },
  { label: "Ending", categories: ["strong-finish", "celebration"] },
];

function SummaryPanel({ highlights, onBuildStory, building }: { highlights: Highlight[]; onBuildStory: () => void; building: boolean }) {
  const approved = highlights.filter((h) => h.status === "approved");
  const rejected = highlights.filter((h) => h.status === "rejected");
  const unreviewed = highlights.filter((h) => h.status === "suggested");
  const essential = highlights.filter((h) => h.priority === "essential" && h.status !== "rejected");
  const approvedSeconds = approved.reduce((s, h) => s + (h.endSeconds - h.startSeconds), 0);

  return (
    <aside className={styles.summary} aria-label="Review summary">
      <h3 className={styles.summaryTitle}>Where you stand</h3>
      <dl className={styles.summaryStats}>
        <div><dt>Found</dt><dd>{highlights.length}</dd></div>
        <div><dt>Approved</dt><dd>{approved.length}</dd></div>
        <div><dt>Rejected</dt><dd>{rejected.length}</dd></div>
        <div><dt>To review</dt><dd>{unreviewed.length}</dd></div>
        <div><dt>Essential</dt><dd>{essential.length}</dd></div>
      </dl>
      <p className={styles.summaryDuration}>
        Approved footage: <strong>{formatDurationLong(Math.round(approvedSeconds))}</strong>
      </p>

      <div className={styles.coverage}>
        <p className={styles.coverageTitle}>Story coverage</p>
        {COVERAGE_GROUPS.map((group) => {
          const count = approved.filter((h) => group.categories.includes(h.category)).length;
          const strength = count >= 3 ? "Strong" : count >= 1 ? "Light" : "Needs more footage";
          const tone = count >= 3 ? "ok" : count >= 1 ? "warn" : "danger";
          return (
            <div key={group.label} className={styles.coverageRow}>
              <span>{group.label}</span>
              <Badge tone={tone as "ok" | "warn" | "danger"}>{strength}</Badge>
            </div>
          );
        })}
      </div>

      <Button variant="primary" size="lg" disabled={approved.length === 0} loading={building} onClick={onBuildStory}>
        Build my story
      </Button>
      {approved.length === 0 && <p className={styles.summaryHint}>Approve at least one highlight to build a story.</p>}
    </aside>
  );
}

/* ---------- Main screen ---------- */

type ViewTab = "review" | "approved" | "rejected" | "essential" | "all";

export function Highlights() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: highlights, isLoading } = useHighlights(project.id);
  const { data: media } = useMedia(project.id);
  const { data: job } = useAnalysisStatus(project.id);
  const patch = usePatchHighlight(project.id);
  const bulk = useBulkHighlights(project.id);
  const startAnalysis = useStartAnalysis(project.id);
  const generateStory = useGenerateStory(project.id);

  const [tab, setTab] = useState<ViewTab>("review");
  const [category, setCategory] = useState<"all" | HighlightCategory>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [trimming, setTrimming] = useState<Highlight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaById = useMemo(() => new Map((media ?? []).map((m) => [m.id, m])), [media]);

  const list = useMemo(() => {
    let l = highlights ?? [];
    if (tab === "review") l = l.filter((h) => h.status === "suggested");
    if (tab === "approved") l = l.filter((h) => h.status === "approved");
    if (tab === "rejected") l = l.filter((h) => h.status === "rejected");
    if (tab === "essential") l = l.filter((h) => h.priority === "essential" && h.status !== "rejected");
    if (category !== "all") l = l.filter((h) => h.category === category);
    return l;
  }, [highlights, tab, category]);

  const running = job?.status === "running";

  if (running) {
    return <AnalysisProgress job={job} />;
  }

  if (!isLoading && (highlights ?? []).length === 0) {
    return (
      <EmptyState
        icon={<IconFilm size={24} />}
        title="No highlights yet"
        message="Storyline reads your footage against your creative brief and suggests the moments worth keeping."
        action={
          <Button
            variant="primary"
            loading={startAnalysis.isPending}
            onClick={() => startAnalysis.mutate(undefined, { onError: (err) => setError(err.message) })}
          >
            Find my highlights
          </Button>
        }
      />
    );
  }

  const counts = {
    review: (highlights ?? []).filter((h) => h.status === "suggested").length,
    approved: (highlights ?? []).filter((h) => h.status === "approved").length,
    rejected: (highlights ?? []).filter((h) => h.status === "rejected").length,
    essential: (highlights ?? []).filter((h) => h.priority === "essential" && h.status !== "rejected").length,
    all: (highlights ?? []).length,
  };

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "review", label: `Review queue (${counts.review})` },
    { id: "approved", label: `Approved (${counts.approved})` },
    { id: "rejected", label: `Rejected (${counts.rejected})` },
    { id: "essential", label: `Essential (${counts.essential})` },
    { id: "all", label: `All (${counts.all})` },
  ];

  const bulkApply = (patchBody: Parameters<typeof bulk.mutate>[0]["patch"]) => {
    bulk.mutate({ ids: [...selected], patch: patchBody }, { onSettled: () => setSelected(new Set()) });
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Your highlights</h2>
            <p className={styles.subtitle}>
              Storyline found {pluralize(counts.all, "moment")} and explains every choice. You decide what stays.
            </p>
          </div>
        </header>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.tabs} role="tablist" aria-label="Highlight views">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as "all" | HighlightCategory)}
            aria-label="Filter by category"
            className={styles.categoryFilter}
          >
            <option value="all">All categories</option>
            {HIGHLIGHT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </Select>
        </div>

        {selected.size > 0 && (
          <div className={styles.bulkBar}>
            <span>{pluralize(selected.size, "highlight")} selected</span>
            <Button size="sm" onClick={() => bulkApply({ status: "approved" })}>Approve</Button>
            <Button size="sm" onClick={() => bulkApply({ status: "rejected" })}>Reject</Button>
            <Button size="sm" onClick={() => bulkApply({ priority: "essential" })}>Mark essential</Button>
            <Button size="sm" onClick={() => bulkApply({ priority: "optional" })}>Mark optional</Button>
            <Select
              aria-label="Change category for selected"
              value=""
              onChange={(e) => e.target.value && bulkApply({ category: e.target.value as HighlightCategory })}
              className={styles.bulkCategory}
            >
              <option value="">Change category…</option>
              {HIGHLIGHT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            title={tab === "review" ? "Review queue is clear" : "Nothing here yet"}
            message={
              tab === "review"
                ? "Every highlight has been reviewed. Check the summary and build your story."
                : "Adjust the view or category filters to see more."
            }
          />
        ) : (
          <ul className={styles.grid}>
            {list.map((h) => (
              <li key={h.id}>
                <HighlightCard
                  highlight={h}
                  media={mediaById.get(h.mediaItemId)}
                  selected={selected.has(h.id)}
                  onSelect={(sel) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (sel) next.add(h.id);
                      else next.delete(h.id);
                      return next;
                    })
                  }
                  onPatch={(body) => patch.mutate({ id: h.id, ...body })}
                  onTrim={() => setTrimming(h)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <SummaryPanel
        highlights={highlights ?? []}
        building={generateStory.isPending}
        onBuildStory={() =>
          generateStory.mutate(undefined, {
            onSuccess: () => navigate(`/projects/${project.id}/story`),
            onError: (err) => setError(err.message),
          })
        }
      />

      {trimming && (
        <TrimModal
          highlight={trimming}
          media={mediaById.get(trimming.mediaItemId)}
          onClose={() => setTrimming(null)}
          onSave={(body) => {
            patch.mutate({ id: trimming.id, ...body });
            setTrimming(null);
          }}
        />
      )}
    </div>
  );
}
