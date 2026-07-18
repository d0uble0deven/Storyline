import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExportConfig } from "@storyline/shared";
import { useLatestExport, useRenderPlan, useStartExport, useStory } from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Select } from "../../components/atoms/Select.js";
import { Spinner } from "../../components/atoms/Spinner.js";
import { Progress } from "../../components/atoms/Progress.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { FormField } from "../../components/molecules/FormField.js";
import { IconCheck, IconCloud, IconDownload, IconShare, IconShield } from "../../components/icons.js";
import { formatBytes, formatDate, formatDuration } from "../../lib/format.js";
import styles from "./Export.module.css";

const ASPECTS: { id: ExportConfig["aspect"]; label: string; hint: string }[] = [
  { id: "16:9", label: "Landscape 16:9", hint: "TVs, YouTube, laptops" },
  { id: "9:16", label: "Vertical 9:16", hint: "Stories, Reels, TikTok" },
  { id: "1:1", label: "Square 1:1", hint: "Feeds and previews" },
];

export function ExportScreen() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: story } = useStory(project.id);
  const { data: job, isLoading } = useLatestExport(project.id);
  const startExport = useStartExport(project.id);
  const [aspect, setAspect] = useState<ExportConfig["aspect"]>("16:9");
  const [resolution, setResolution] = useState<ExportConfig["resolution"]>("1080p");
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const { data: renderPlan } = useRenderPlan(project.id, showPlan && Boolean(story));

  if (!story) {
    return (
      <EmptyState
        title="Nothing to export yet"
        message="Build and refine your story first — then come back here to create the finished film."
        action={
          <Button variant="primary" onClick={() => navigate(`/projects/${project.id}/story`)}>
            Go to story builder
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return <div className={styles.loading}><Spinner size={24} label="Checking export status" /></div>;
  }

  /* --- Rendering in progress --- */
  if (job?.status === "running") {
    return (
      <div className={styles.narrow}>
        <h2 className={styles.title}>Creating your film</h2>
        <p className={styles.subtitle}>This usually takes a moment. You can leave and come back — we keep working.</p>
        <Progress value={job.progress} label="Render progress" />
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
      </div>
    );
  }

  /* --- Success --- */
  if (job?.status === "complete" && job.result) {
    const r = job.result;
    return (
      <div className={styles.narrow}>
        <div className={styles.successHead}>
          <span className={styles.successIcon}><IconCheck size={22} /></span>
          <div>
            <h2 className={styles.title}>Your film is ready</h2>
            <p className={styles.subtitle}>A year of moments, {formatDuration(r.durationSeconds)} of story.</p>
          </div>
        </div>

        <div className={styles.finished}>
          {project.coverUrl && <img src={project.coverUrl} alt="Finished video preview frame" className={styles.finishedPoster} />}
          <dl className={styles.finishedMeta}>
            <div><dt>Duration</dt><dd>{formatDuration(r.durationSeconds)}</dd></div>
            <div><dt>File size</dt><dd>{formatBytes(r.fileSizeBytes)}</dd></div>
            <div><dt>Resolution</dt><dd>{r.width}×{r.height}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(r.completedAt)}</dd></div>
          </dl>
        </div>

        <div className={styles.successActions}>
          <a href={r.downloadUrl} download className={styles.downloadLink}>
            <Button variant="primary" size="lg" icon={<IconDownload size={16} />}>Download MP4</Button>
          </a>
          <Button
            icon={<IconShare size={15} />}
            onClick={() => {
              void navigator.clipboard?.writeText(`https://storyline.example/share/${project.id}`).catch(() => undefined);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
          >
            {linkCopied ? "Link copied" : "Copy private share link"}
          </Button>
        </div>

        <div className={styles.placeholderRow}>
          {["Save to Google Photos", "Save to Google Drive", "Publish to YouTube", "Publish to Instagram"].map((label) => (
            <span key={label} className={styles.placeholderChip}>
              <IconCloud size={13} /> {label} — coming soon
            </span>
          ))}
        </div>

        <p className={styles.privacy}>
          <IconShield size={14} /> Share links are private by default and can be revoked at any time.
        </p>

        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={() => startExport.mutate({ aspect, resolution, format: "mp4" })}>
            Create another version
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}`)}>
            Return to project
          </Button>
        </div>
      </div>
    );
  }

  /* --- Configuration --- */
  return (
    <div className={styles.narrow}>
      <h2 className={styles.title}>Finish your film</h2>
      <p className={styles.subtitle}>Choose how your story should be delivered. Everything else is already in place.</p>

      <div className={styles.aspects} role="radiogroup" aria-label="Export format">
        {ASPECTS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={aspect === a.id}
            className={`${styles.aspectCard} ${aspect === a.id ? styles.aspectActive : ""}`}
            onClick={() => setAspect(a.id)}
          >
            <span className={`${styles.aspectShape} ${styles[`shape${a.id.replace(":", "x")}`]}`} />
            <span className={styles.aspectLabel}>{a.label}</span>
            <span className={styles.aspectHint}>{a.hint}</span>
          </button>
        ))}
      </div>

      <FormField label="Resolution">
        <Select value={resolution} onChange={(e) => setResolution(e.target.value as ExportConfig["resolution"])}>
          <option value="720p">720p — smaller file</option>
          <option value="1080p">1080p — recommended</option>
          <option value="4k" disabled>4K — coming soon</option>
        </Select>
      </FormField>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        loading={startExport.isPending}
        onClick={() =>
          startExport.mutate({ aspect, resolution, format: "mp4" }, { onError: (err) => setError(err.message) })
        }
      >
        Create my film
      </Button>

      <button type="button" className={styles.planToggle} onClick={() => setShowPlan((s) => !s)}>
        {showPlan ? "Hide" : "Show"} the structured render plan
      </button>
      {showPlan && renderPlan && (
        <div className={styles.renderPlan}>
          <p className={styles.renderPlanHead}>
            {renderPlan.width}×{renderPlan.height} · {renderPlan.frameRate} fps · {renderPlan.clips.length} clips ·{" "}
            {formatDuration(renderPlan.totalDurationSeconds)}
          </p>
          <p className={styles.renderPlanHint}>
            This is the exact plan a rendering engine will execute — every clip's source, in/out points, and timeline
            position. In this preview, rendering itself is simulated.
          </p>
          <pre className={styles.renderPlanJson}>{JSON.stringify(renderPlan, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
