import { useEffect, useMemo, useRef, useState } from "react";
import type { Highlight, MediaItem, StoryChapter, StoryItem } from "@storyline/shared";
import { IconButton } from "../atoms/IconButton.js";
import { IconMaximize, IconPause, IconPlay } from "../icons.js";
import { formatDuration } from "../../lib/format.js";
import styles from "./VideoPreview.module.css";

export type ResolvedItem = {
  item: StoryItem;
  chapterTitle: string;
  highlight?: Highlight;
  media?: MediaItem;
};

export function resolveStoryItems(
  chapters: StoryChapter[],
  highlights: Highlight[],
  media: MediaItem[]
): ResolvedItem[] {
  const hById = new Map(highlights.map((h) => [h.id, h]));
  const mById = new Map(media.map((m) => [m.id, m]));
  const out: ResolvedItem[] = [];
  for (const chapter of chapters) {
    for (const item of chapter.items) {
      const highlight = item.highlightId ? hById.get(item.highlightId) : undefined;
      out.push({
        item,
        chapterTitle: chapter.title,
        highlight,
        media: highlight ? mById.get(highlight.mediaItemId) : undefined,
      });
    }
  }
  return out;
}

type Props = {
  items: ResolvedItem[];
  /** Index of an item to jump to when it changes (e.g. selecting a clip in the strip). */
  focusIndex?: number;
  onActiveIndexChange?: (index: number) => void;
};

/**
 * The first-cut preview player. Plays real uploaded videos natively and
 * simulates playback over poster art for demo media — one seamless timeline.
 */
export function VideoPreview({ items, focusIndex, onActiveIndexChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const boundaries = useMemo(() => {
    let cursor = 0;
    return items.map((entry) => {
      const start = cursor;
      cursor += entry.item.durationSeconds;
      return { start, end: cursor, entry };
    });
  }, [items]);
  const total = boundaries.length > 0 ? boundaries[boundaries.length - 1].end : 0;

  const activeIndex = useMemo(() => {
    const idx = boundaries.findIndex((b) => position < b.end);
    return idx === -1 ? boundaries.length - 1 : idx;
  }, [boundaries, position]);

  const active = boundaries[activeIndex];

  useEffect(() => {
    if (focusIndex !== undefined && boundaries[focusIndex]) {
      setPosition(boundaries[focusIndex].start + 0.01);
    }
  }, [focusIndex, boundaries]);

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  // The shared clock that drives the whole timeline.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        const next = p + 0.2;
        if (next >= total) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(timer);
  }, [playing, total]);

  // Keep a real <video> roughly in sync when the active clip has real footage.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;
    const highlight = active.entry.highlight;
    const offset = position - active.start;
    const target = (highlight?.startSeconds ?? 0) + offset;
    if (Math.abs(video.currentTime - target) > 0.6) {
      video.currentTime = target;
    }
    if (playing && video.paused) void video.play().catch(() => undefined);
    if (!playing && !video.paused) video.pause();
  }, [playing, position, active]);

  if (items.length === 0) {
    return (
      <div className={styles.player}>
        <div className={styles.emptyPlayer}>Your first cut will play here.</div>
      </div>
    );
  }

  const entry = active?.entry;
  const isTitleCard = entry?.item.type === "title-card";
  const hasRealVideo = Boolean(entry?.media?.previewUrl);

  return (
    <div className={styles.player} ref={containerRef}>
      <div className={styles.stage}>
        {isTitleCard ? (
          <div className={styles.titleCard}>
            <p className={styles.titleCardTitle}>{entry?.item.title}</p>
            {entry?.item.subtitle && <p className={styles.titleCardSubtitle}>{entry.item.subtitle}</p>}
          </div>
        ) : hasRealVideo ? (
          <video
            ref={videoRef}
            src={entry?.media?.previewUrl}
            className={styles.video}
            muted
            playsInline
            preload="metadata"
          >
            <track kind="captions" label="Captions coming soon" />
          </video>
        ) : (
          <img
            src={entry?.media?.thumbnailUrl}
            alt={entry?.highlight?.title ?? "Story clip"}
            className={styles.video}
          />
        )}
        {!isTitleCard && entry?.highlight && (
          <div className={styles.clipInfo}>
            <p className={styles.clipTitle}>{entry.highlight.title}</p>
            <p className={styles.chapter}>{entry.chapterTitle}</p>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <IconButton
          label={playing ? "Pause preview" : "Play preview"}
          onClick={() => setPlaying((p) => !p)}
          className={styles.playButton}
        >
          {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </IconButton>
        <span className={styles.time}>{formatDuration(position)}</span>
        <input
          type="range"
          className={styles.seek}
          min={0}
          max={Math.max(total, 1)}
          step={0.1}
          value={Math.min(position, total)}
          aria-label="Seek through the first cut"
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <span className={styles.time}>{formatDuration(total)}</span>
        <IconButton
          label="Full-screen preview"
          onClick={() => containerRef.current?.requestFullscreen?.().catch(() => undefined)}
        >
          <IconMaximize size={16} />
        </IconButton>
      </div>
    </div>
  );
}
