import { Link } from "react-router-dom";
import { PROJECT_STAGES, stageIndex } from "@storyline/shared";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Progress } from "../../components/atoms/Progress.js";
import { IconChevronRight } from "../../components/icons.js";
import { formatDurationLong, pluralize } from "../../lib/format.js";
import styles from "./Overview.module.css";

const STAGE_ROUTES = ["media", "brief", "plan", "highlights", "story", "editor", "export"];

const STAGE_BLURBS = [
  "Add the videos your story lives in.",
  "Describe the finished film in your own words.",
  "Review the instructions Storyline built from your brief.",
  "Approve the moments worth keeping.",
  "Shape chapters and refine the sequence.",
  "Preview the first cut and finish the look and sound.",
  "Export and share your story.",
];

export function Overview() {
  const { project } = useProjectContext();
  const unlockedIdx = stageIndex(project.currentStage);
  const continueRoute = STAGE_ROUTES[unlockedIdx];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          {project.description && <p className={styles.description}>{project.description}</p>}
          <div className={styles.progressRow}>
            <Progress value={project.progressPercent} label="Project progress" />
            <span className={styles.pct}>{project.progressPercent}%</span>
          </div>
          <p className={styles.stats}>
            {pluralize(project.stats.mediaCount, "video")} · {pluralize(project.stats.approved, "approved highlight")}
            {project.stats.approvedDurationSeconds > 0 &&
              ` · about ${formatDurationLong(project.stats.approvedDurationSeconds)} of approved footage`}
          </p>
        </div>
        <Link to={`/projects/${project.id}/${continueRoute}`} style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg" icon={<IconChevronRight size={16} />}>
            Pick up where you left off
          </Button>
        </Link>
      </header>

      <ol className={styles.stages}>
        {PROJECT_STAGES.map((stage, i) => {
          const unlocked = i <= unlockedIdx + 1;
          const done = i < unlockedIdx;
          return (
            <li key={stage.id}>
              <Link
                to={unlocked ? `/projects/${project.id}/${STAGE_ROUTES[i]}` : "#"}
                className={`${styles.stageCard} ${!unlocked ? styles.locked : ""} ${done ? styles.done : ""}`}
                aria-disabled={!unlocked}
                tabIndex={unlocked ? 0 : -1}
                onClick={(e) => !unlocked && e.preventDefault()}
              >
                <span className={styles.stageNum}>{i + 1}</span>
                <span className={styles.stageBody}>
                  <span className={styles.stageTitle}>{stage.label}</span>
                  <span className={styles.stageBlurb}>{STAGE_BLURBS[i]}</span>
                </span>
                <span className={styles.stageState}>{done ? "Done" : unlocked ? "Open" : "Locked"}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
