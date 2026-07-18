import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import type { ProjectStage, ProjectSummary } from "@storyline/shared";
import { PROJECT_STAGES, stageIndex } from "@storyline/shared";
import { useProject } from "../../api/hooks.js";
import { Button } from "../../components/atoms/Button.js";
import { Spinner } from "../../components/atoms/Spinner.js";
import { IconButton } from "../../components/atoms/IconButton.js";
import { Modal } from "../../components/molecules/Modal.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { IconCheck, IconChevronRight, IconHelp } from "../../components/icons.js";
import styles from "./ProjectLayout.module.css";

export type ProjectContext = { project: ProjectSummary };

export function useProjectContext(): ProjectContext {
  return useOutletContext<ProjectContext>();
}

const STAGE_ROUTES: Record<ProjectStage, string> = {
  media: "media",
  brief: "brief",
  plan: "plan",
  highlights: "highlights",
  story: "story",
  "first-cut": "editor",
  finish: "export",
};

export function ProjectLayout() {
  const { projectId } = useParams();
  const { data: project, isLoading, error } = useProject(projectId);
  const location = useLocation();
  const mutating = useIsMutating();
  const [helpOpen, setHelpOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size={26} label="Loading project" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <EmptyState
        title="We couldn't find that project"
        message={error?.message ?? "It may have been deleted, or the link is wrong."}
        action={
          <Link to="/projects" style={{ textDecoration: "none" }}>
            <Button variant="primary">Back to projects</Button>
          </Link>
        }
      />
    );
  }

  const unlockedIndex = stageIndex(project.currentStage);
  const currentRouteStage =
    PROJECT_STAGES.find((s) => location.pathname.endsWith(`/${STAGE_ROUTES[s.id]}`))?.id ?? null;
  const currentRouteIdx = currentRouteStage ? stageIndex(currentRouteStage) : -1;
  const nextStage =
    currentRouteIdx >= 0 && currentRouteIdx < PROJECT_STAGES.length - 1
      ? PROJECT_STAGES[currentRouteIdx + 1]
      : null;
  // The next stage is always reachable — screens guide you if you arrive early.
  const nextUnlocked = nextStage ? stageIndex(nextStage.id) <= unlockedIndex + 1 : false;

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1 className={styles.projectName}>{project.name}</h1>
          <span className={styles.saveStatus} role="status">
            {mutating > 0 ? (
              <>
                <Spinner size={12} /> Saving…
              </>
            ) : (
              <>
                <IconCheck size={12} /> All changes saved
              </>
            )}
          </span>
        </div>
        <div className={styles.topbarRight}>
          <IconButton label="Help" onClick={() => setHelpOpen(true)}>
            <IconHelp size={17} />
          </IconButton>
          {nextStage && (
            <Link
              to={nextUnlocked ? `/projects/${project.id}/${STAGE_ROUTES[nextStage.id]}` : "#"}
              tabIndex={nextUnlocked ? 0 : -1}
              aria-disabled={!nextUnlocked}
              style={{ textDecoration: "none" }}
            >
              <Button variant="primary" size="sm" disabled={!nextUnlocked} icon={<IconChevronRight size={14} />}>
                Continue: {nextStage.label}
              </Button>
            </Link>
          )}
        </div>
      </header>

      <nav className={styles.stageNav} aria-label="Project stages">
        {PROJECT_STAGES.map((stage, i) => {
          const unlocked = i <= unlockedIndex + 1;
          const done = i < unlockedIndex;
          return (
            <NavLink
              key={stage.id}
              to={`/projects/${project.id}/${STAGE_ROUTES[stage.id]}`}
              className={({ isActive }) =>
                [
                  styles.stage,
                  isActive ? styles.stageActive : "",
                  done ? styles.stageDone : "",
                  !unlocked ? styles.stageLocked : "",
                ].join(" ")
              }
              aria-disabled={!unlocked}
              tabIndex={unlocked ? 0 : -1}
              onClick={(e) => !unlocked && e.preventDefault()}
            >
              <span className={styles.stageDot}>{done ? <IconCheck size={10} /> : i + 1}</span>
              <span className={styles.stageLabel}>{stage.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <main className={styles.main}>
        <Outlet context={{ project } satisfies ProjectContext} />
      </main>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="How Storyline works" width={520}>
        <ol className={styles.helpList}>
          <li><strong>Media</strong> — add the videos your story lives in.</li>
          <li><strong>Creative brief</strong> — describe the finished film in your own words.</li>
          <li><strong>Production plan</strong> — Storyline turns your brief into editable instructions.</li>
          <li><strong>Highlights</strong> — review the moments Storyline found; approve the keepers.</li>
          <li><strong>Story</strong> — shape the chapters, reorder clips, ask for changes in plain language.</li>
          <li><strong>First cut</strong> — preview your film and finish the look, sound, and titles.</li>
          <li><strong>Finish</strong> — export and share your story.</li>
        </ol>
        <p className={styles.helpHint}>You can move back to any earlier stage at any time — nothing is lost.</p>
      </Modal>
    </div>
  );
}
