import type { Highlight, HighlightCategory, MediaItem } from "@storyline/shared";
import { HIGHLIGHT_CATEGORIES } from "@storyline/shared";
import { Badge } from "../atoms/Badge.js";
import { IconButton } from "../atoms/IconButton.js";
import { Checkbox } from "../atoms/Checkbox.js";
import { Select } from "../atoms/Select.js";
import { MediaThumbnail } from "../molecules/MediaThumbnail.js";
import { HighlightStatusBadge } from "../molecules/StatusBadge.js";
import { ScoreIndicator } from "../molecules/ScoreIndicator.js";
import { IconCheck, IconFlag, IconHeart, IconNote, IconScissors, IconX } from "../icons.js";
import { formatDate, formatDuration } from "../../lib/format.js";
import styles from "./HighlightCard.module.css";

type Props = {
  highlight: Highlight;
  media?: MediaItem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onPatch: (patch: Partial<Pick<Highlight, "status" | "priority" | "category" | "isFavorite">>) => void;
  onTrim: () => void;
};

export function HighlightCard({ highlight, media, selected, onSelect, onPatch, onTrim }: Props) {
  const duration = highlight.endSeconds - highlight.startSeconds;
  const isEssential = highlight.priority === "essential";
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <div className={styles.thumbWrap}>
        <MediaThumbnail
          thumbnailUrl={media?.thumbnailUrl}
          alt={media ? `Clip from ${media.originalFilename}` : "Source clip"}
          timeRange={[highlight.startSeconds, highlight.endSeconds]}
        />
        <div className={styles.selectBox}>
          <Checkbox checked={selected} onChange={onSelect} label={`Select ${highlight.title}`} hideLabel />
        </div>
        {isEssential && (
          <span className={styles.essential}>
            <Badge tone="accent">Essential</Badge>
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <HighlightStatusBadge status={highlight.status} />
          <span className={styles.meta}>
            {formatDate(media?.recordedAt)} · {formatDuration(duration)}
          </span>
        </div>
        <h3 className={styles.title}>{highlight.title}</h3>
        <p className={styles.description}>{highlight.description}</p>
        <p className={styles.reasoning}>
          <span className={styles.reasoningLabel}>Why Storyline picked it:</span> {highlight.aiReasoning}
        </p>
        {highlight.userNote && (
          <p className={styles.note}>
            <IconNote size={13} /> {highlight.userNote}
          </p>
        )}

        <div className={styles.scores}>
          <ScoreIndicator label="Story relevance" value={highlight.scores.storyRelevance} />
          <ScoreIndicator label="Progression" value={highlight.scores.progressionValue} />
          <ScoreIndicator label="Visual quality" value={highlight.scores.visualQuality} />
          <ScoreIndicator label="Emotional value" value={highlight.scores.emotionalValue} />
        </div>

        <div className={styles.footer}>
          <Select
            value={highlight.category}
            aria-label={`Category for ${highlight.title}`}
            className={styles.category}
            onChange={(e) => onPatch({ category: e.target.value as HighlightCategory })}
          >
            {HIGHLIGHT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          <div className={styles.actions}>
            <IconButton
              label={highlight.status === "approved" ? "Approved — click to reset" : "Approve"}
              active={highlight.status === "approved"}
              onClick={() => onPatch({ status: highlight.status === "approved" ? "suggested" : "approved" })}
            >
              <IconCheck size={16} />
            </IconButton>
            <IconButton
              label={highlight.status === "rejected" ? "Rejected — click to reset" : "Reject"}
              tone="danger"
              active={highlight.status === "rejected"}
              onClick={() => onPatch({ status: highlight.status === "rejected" ? "suggested" : "rejected" })}
            >
              <IconX size={16} />
            </IconButton>
            <IconButton
              label={highlight.isFavorite ? "Remove favorite" : "Favorite"}
              active={highlight.isFavorite}
              onClick={() => onPatch({ isFavorite: !highlight.isFavorite })}
            >
              <IconHeart size={15} />
            </IconButton>
            <IconButton
              label={isEssential ? "Essential — click to make optional" : "Mark essential"}
              active={isEssential}
              onClick={() => onPatch({ priority: isEssential ? "optional" : "essential" })}
            >
              <IconFlag size={15} />
            </IconButton>
            <IconButton label="Trim clip" onClick={onTrim}>
              <IconScissors size={15} />
            </IconButton>
          </div>
        </div>
      </div>
    </article>
  );
}
