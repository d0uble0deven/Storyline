import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PlanSection, PlanSectionKey } from "@storyline/shared";
import { PLAN_SECTION_META } from "@storyline/shared";
import {
  useGeneratePlan,
  useHighlights,
  usePatchPlan,
  usePlan,
  useStartAnalysis,
} from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Badge } from "../../components/atoms/Badge.js";
import { Spinner } from "../../components/atoms/Spinner.js";
import { Textarea } from "../../components/atoms/Textarea.js";
import { IconButton } from "../../components/atoms/IconButton.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { IconLock, IconRefresh, IconUndo, IconUnlock, IconWarning } from "../../components/icons.js";
import { formatDurationLong } from "../../lib/format.js";
import styles from "./Plan.module.css";

function SectionEditor({
  sectionKey,
  title,
  section,
  onSave,
  onToggleLock,
  onReset,
  onRegenerate,
  busy,
}: {
  sectionKey: PlanSectionKey;
  title: string;
  section: PlanSection;
  onSave: (value: string) => void;
  onToggleLock: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? section.value;
  const dirty = draft !== null && draft !== section.value;

  return (
    <section className={`${styles.section} ${section.isLocked ? styles.sectionLocked : ""}`} aria-label={title}>
      <header className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.sectionBadges}>
          {section.isLocked && <Badge tone="warn">Locked</Badge>}
          {section.isUserEdited ? <Badge tone="info">Edited by you</Badge> : <Badge tone="neutral">AI suggestion</Badge>}
        </div>
        <div className={styles.sectionActions}>
          <IconButton
            label={section.isLocked ? `Unlock ${title}` : `Lock ${title} so regeneration never changes it`}
            active={section.isLocked}
            onClick={onToggleLock}
          >
            {section.isLocked ? <IconLock size={15} /> : <IconUnlock size={15} />}
          </IconButton>
          <IconButton
            label={`Regenerate ${title}`}
            disabled={section.isLocked || busy}
            onClick={onRegenerate}
          >
            <IconRefresh size={15} />
          </IconButton>
          <IconButton
            label={`Reset ${title} to the AI suggestion`}
            disabled={!section.isUserEdited}
            onClick={() => {
              setDraft(null);
              onReset();
            }}
          >
            <IconUndo size={15} />
          </IconButton>
        </div>
      </header>
      <Textarea
        value={value}
        rows={3}
        aria-label={`${title} instructions`}
        disabled={section.isLocked}
        onChange={(e) => setDraft(e.target.value)}
        data-section={sectionKey}
      />
      {dirty && (
        <div className={styles.applyRow}>
          <Button size="sm" variant="primary" onClick={() => { onSave(value); setDraft(null); }}>
            Apply changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
            Discard
          </Button>
        </div>
      )}
    </section>
  );
}

export function Plan() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(project.id);
  const { data: highlights } = useHighlights(project.id);
  const generate = useGeneratePlan(project.id);
  const patch = usePatchPlan(project.id);
  const startAnalysis = useStartAnalysis(project.id);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <div className={styles.loading}><Spinner size={24} label="Loading production plan" /></div>;
  }

  if (!plan) {
    return (
      <EmptyState
        title="No production plan yet"
        message="Write your creative brief and Storyline will turn it into a plan you can shape section by section."
        action={
          <Button variant="primary" onClick={() => navigate(`/projects/${project.id}/brief`)}>
            Go to creative brief
          </Button>
        }
      />
    );
  }

  // Conflict detection: essential footage vs. target length.
  const target = project.creativeBrief?.targetDurationSeconds;
  const essential = (highlights ?? []).filter((h) => h.priority === "essential" && h.status !== "rejected");
  const essentialSeconds = essential.reduce((s, h) => s + (h.endSeconds - h.startSeconds), 0);
  const conflict =
    target && essentialSeconds > target
      ? `Your target length is ${formatDurationLong(target)}, but ${essential.length} highlights marked essential add up to ${formatDurationLong(Math.round(essentialSeconds))}. Consider extending the video or making some highlights optional.`
      : null;

  const onFindHighlights = () => {
    setError(null);
    startAnalysis.mutate(undefined, {
      onSuccess: () => navigate(`/projects/${project.id}/highlights`),
      onError: (err) => setError(err.message),
    });
  };

  const hasHighlights = (highlights ?? []).length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Production plan</h2>
          <p className={styles.subtitle}>
            Storyline turned your brief into working instructions. Edit anything — lock what must not change.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<IconRefresh size={15} />}
            loading={generate.isPending}
            onClick={() => generate.mutate(undefined, { onError: (err) => setError(err.message) })}
          >
            Update all unlocked sections
          </Button>
          <Button variant="primary" loading={startAnalysis.isPending} onClick={onFindHighlights}>
            {hasHighlights ? "Review my highlights" : "Find my highlights"}
          </Button>
        </div>
      </header>

      {conflict && (
        <p className={styles.conflict} role="alert">
          <IconWarning size={16} /> {conflict}
        </p>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.sections}>
        {PLAN_SECTION_META.map(({ key, title }) => (
          <SectionEditor
            key={key}
            sectionKey={key}
            title={title}
            section={plan[key]}
            busy={generate.isPending}
            onSave={(value) => patch.mutate([{ key, value }], { onError: (err) => setError(err.message) })}
            onToggleLock={() => patch.mutate([{ key, isLocked: !plan[key].isLocked }])}
            onReset={() => patch.mutate([{ key, resetToAi: true }])}
            onRegenerate={() => generate.mutate({ section: key }, { onError: (err) => setError(err.message) })}
          />
        ))}
      </div>
    </div>
  );
}
