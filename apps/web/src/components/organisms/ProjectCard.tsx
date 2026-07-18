import { Link } from "react-router-dom";
import type { ProjectSummary } from "@storyline/shared";
import { STORY_TYPES } from "@storyline/shared";
import { Progress } from "../atoms/Progress.js";
import { StageBadge } from "../molecules/StatusBadge.js";
import { IconButton } from "../atoms/IconButton.js";
import { IconFilm, IconTrash } from "../icons.js";
import { formatDurationLong, pluralize, timeAgo } from "../../lib/format.js";
import styles from "./ProjectCard.module.css";

type Props = {
  project: ProjectSummary;
  onDelete: (project: ProjectSummary) => void;
};

export function ProjectCard({ project, onDelete }: Props) {
  const storyType = STORY_TYPES.find((t) => t.id === project.storyType)?.label ?? project.storyType;
  return (
    <article className={styles.card}>
      <Link to={`/projects/${project.id}`} className={styles.coverLink} aria-label={`Open ${project.name}`}>
        <div className={styles.cover}>
          {project.coverUrl ? (
            <img src={project.coverUrl} alt="" className={styles.coverImg} loading="lazy" />
          ) : (
            <div className={styles.coverFallback}>
              <IconFilm size={28} />
            </div>
          )}
          <div className={styles.coverBadge}>
            <StageBadge stage={project.currentStage} />
          </div>
        </div>
      </Link>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <Link to={`/projects/${project.id}`} className={styles.titleLink}>
            <h3 className={styles.title}>{project.name}</h3>
          </Link>
          <IconButton label={`Delete ${project.name}`} tone="danger" size="sm" onClick={() => onDelete(project)}>
            <IconTrash size={14} />
          </IconButton>
        </div>
        <p className={styles.type}>{storyType}</p>
        <div className={styles.progressRow}>
          <Progress value={project.progressPercent} label={`${project.name} progress`} size="sm" />
          <span className={styles.progressPct}>{project.progressPercent}%</span>
        </div>
        <p className={styles.meta}>
          {pluralize(project.stats.mediaCount, "video")} · {pluralize(project.stats.approved, "approved highlight")}
          {project.stats.approvedDurationSeconds > 0 && ` · ~${formatDurationLong(project.stats.approvedDurationSeconds)}`}
        </p>
        <p className={styles.edited}>Edited {timeAgo(project.updatedAt)}</p>
      </div>
    </article>
  );
}
