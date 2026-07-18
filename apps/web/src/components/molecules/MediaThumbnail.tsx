import { IconFilm } from "../icons.js";
import { formatDuration } from "../../lib/format.js";
import styles from "./MediaThumbnail.module.css";

type Props = {
  thumbnailUrl?: string;
  alt: string;
  durationSeconds?: number;
  timeRange?: [number, number];
  size?: "sm" | "md" | "lg";
};

/** A video thumbnail with duration or in/out badge, and a graceful fallback. */
export function MediaThumbnail({ thumbnailUrl, alt, durationSeconds, timeRange, size = "md" }: Props) {
  return (
    <div className={`${styles.thumb} ${styles[size]}`}>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={alt} loading="lazy" className={styles.img} />
      ) : (
        <div className={styles.fallback} role="img" aria-label={alt}>
          <IconFilm size={22} />
        </div>
      )}
      {timeRange ? (
        <span className={styles.badge}>
          {formatDuration(timeRange[0])}–{formatDuration(timeRange[1])}
        </span>
      ) : durationSeconds !== undefined ? (
        <span className={styles.badge}>{formatDuration(durationSeconds)}</span>
      ) : null}
    </div>
  );
}
