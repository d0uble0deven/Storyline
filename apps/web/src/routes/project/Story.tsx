import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Highlight, MediaItem, StoryChapter, StoryItem, TransitionType } from "@storyline/shared";
import { TRANSITION_TYPES, categoryLabel } from "@storyline/shared";
import {
  useGenerateStory,
  useHighlights,
  useMedia,
  useSaveStory,
  useStory,
  useUndoRedoStory,
} from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Badge } from "../../components/atoms/Badge.js";
import { Select } from "../../components/atoms/Select.js";
import { Spinner } from "../../components/atoms/Spinner.js";
import { IconButton } from "../../components/atoms/IconButton.js";
import { Modal, ConfirmDialog } from "../../components/molecules/Modal.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { MediaThumbnail } from "../../components/molecules/MediaThumbnail.js";
import { RevisionAssistant } from "../../components/organisms/RevisionAssistant.js";
import {
  IconGrip,
  IconLock,
  IconPlus,
  IconRedo,
  IconRefresh,
  IconTrash,
  IconType,
  IconUndo,
  IconUnlock,
} from "../../components/icons.js";
import { formatDuration, formatDurationLong } from "../../lib/format.js";
import styles from "./Story.module.css";

const SUGGESTIONS = [
  "Make the opening shorter",
  "Show more early riding footage",
  "Make the progression more obvious",
  "Move the rainy ride earlier",
  "Make the middle section more energetic",
  "Make the ending stronger",
];

function newId(): string {
  return crypto.randomUUID();
}

type ItemRowProps = {
  item: StoryItem;
  chapters: StoryChapter[];
  chapterId: string;
  highlight?: Highlight;
  media?: MediaItem;
  onChange: (patch: Partial<StoryItem>) => void;
  onRemove: () => void;
  onMove: (toChapterId: string) => void;
  onReplace: () => void;
};

function ItemRow({ item, chapters, chapterId, highlight, media, onChange, onRemove, onMove, onReplace }: ItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isTitleCard = item.type === "title-card";
  const label = isTitleCard ? item.title ?? "Title card" : highlight?.title ?? "Clip";

  return (
    <li ref={setNodeRef} style={style} className={`${styles.item} ${isDragging ? styles.dragging : ""}`}>
      <button type="button" className={styles.grip} aria-label={`Reorder ${label}`} {...attributes} {...listeners}>
        <IconGrip size={15} />
      </button>

      {isTitleCard ? (
        <span className={styles.titleCardThumb}>
          <IconType size={16} />
        </span>
      ) : (
        <MediaThumbnail thumbnailUrl={media?.thumbnailUrl} alt={label} size="sm" />
      )}

      <div className={styles.itemBody}>
        <div className={styles.itemTitleRow}>
          <span className={styles.itemTitle}>{label}</span>
          {isTitleCard ? (
            <Badge tone="info">Title card</Badge>
          ) : (
            highlight && <Badge tone="neutral">{categoryLabel(highlight.category)}</Badge>
          )}
        </div>
        {item.narrativePurpose && <p className={styles.purpose}>{item.narrativePurpose}</p>}
        <div className={styles.itemControls}>
          <label className={styles.durationField}>
            <span className="sr-only">Duration in seconds for {label}</span>
            <input
              type="number"
              min={1}
              max={60}
              step={0.5}
              value={item.durationSeconds}
              onChange={(e) => onChange({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
            />
            s
          </label>
          <Select
            value={item.transitionIn ?? "cut"}
            aria-label={`Transition into ${label}`}
            className={styles.transitionSelect}
            onChange={(e) => onChange({ transitionIn: e.target.value as TransitionType })}
          >
            {TRANSITION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
          <Select
            value={chapterId}
            aria-label={`Move ${label} to chapter`}
            className={styles.moveSelect}
            onChange={(e) => e.target.value !== chapterId && onMove(e.target.value)}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.itemActions}>
        {!isTitleCard && (
          <Button size="sm" variant="ghost" onClick={onReplace}>
            Replace
          </Button>
        )}
        <IconButton
          label={item.isLocked ? `Unlock ${label}` : `Lock ${label} so revisions never move it`}
          active={item.isLocked}
          onClick={() => onChange({ isLocked: !item.isLocked })}
        >
          {item.isLocked ? <IconLock size={14} /> : <IconUnlock size={14} />}
        </IconButton>
        <IconButton label={`Remove ${label} from story`} tone="danger" onClick={onRemove}>
          <IconTrash size={14} />
        </IconButton>
      </div>
    </li>
  );
}

export function Story() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: story, isLoading } = useStory(project.id);
  const { data: highlights } = useHighlights(project.id);
  const { data: media } = useMedia(project.id);
  const generate = useGenerateStory(project.id);
  const save = useSaveStory(project.id);
  const { undo, redo } = useUndoRedoStory(project.id);
  const [replacing, setReplacing] = useState<{ chapterId: string; itemId: string } | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const highlightById = useMemo(() => new Map((highlights ?? []).map((h) => [h.id, h])), [highlights]);
  const mediaById = useMemo(() => new Map((media ?? []).map((m) => [m.id, m])), [media]);

  const chapters = story?.chapters ?? [];
  const totalSeconds = chapters.reduce((s, c) => s + c.items.reduce((x, i) => x + i.durationSeconds, 0), 0);
  const usedHighlightIds = new Set(chapters.flatMap((c) => c.items.map((i) => i.highlightId)).filter(Boolean));
  const available = (highlights ?? []).filter((h) => h.status === "approved" && !usedHighlightIds.has(h.id));

  const commit = (next: StoryChapter[]) => {
    save.mutate({ chapters: next }, { onError: (err) => setError(err.message) });
  };

  const updateItem = (chapterId: string, itemId: string, patch: Partial<StoryItem>) => {
    commit(
      chapters.map((c) =>
        c.id === chapterId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : c
      )
    );
  };

  const removeItem = (chapterId: string, itemId: string) => {
    commit(chapters.map((c) => (c.id === chapterId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)));
  };

  const moveItem = (fromChapterId: string, itemId: string, toChapterId: string) => {
    const item = chapters.find((c) => c.id === fromChapterId)?.items.find((i) => i.id === itemId);
    if (!item) return;
    commit(
      chapters.map((c) => {
        if (c.id === fromChapterId) return { ...c, items: c.items.filter((i) => i.id !== itemId) };
        if (c.id === toChapterId) return { ...c, items: [...c.items, item] };
        return c;
      })
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const chapter = chapters.find((c) => c.items.some((i) => i.id === active.id));
    if (!chapter || !chapter.items.some((i) => i.id === over.id)) return;
    const oldIndex = chapter.items.findIndex((i) => i.id === active.id);
    const newIndex = chapter.items.findIndex((i) => i.id === over.id);
    commit(
      chapters.map((c) =>
        c.id === chapter.id ? { ...c, items: arrayMove(c.items, oldIndex, newIndex) } : c
      )
    );
  };

  const addTitleCard = (chapterId: string) => {
    commit(
      chapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: newId(),
                  type: "title-card" as const,
                  title: "New title card",
                  durationSeconds: 4,
                  isLocked: false,
                },
              ],
            }
          : c
      )
    );
  };

  const replaceWith = (highlight: Highlight) => {
    if (!replacing) return;
    updateItem(replacing.chapterId, replacing.itemId, {
      highlightId: highlight.id,
      durationSeconds: Math.min(Math.max(highlight.endSeconds - highlight.startSeconds, 3), 14),
    });
    setReplacing(null);
  };

  if (isLoading) {
    return <div className={styles.loading}><Spinner size={24} label="Loading story" /></div>;
  }

  if (!story) {
    return (
      <EmptyState
        title="No story yet"
        message="Once you've approved highlights, Storyline arranges them into chapters with a clear beginning, middle, and end."
        action={
          <Button
            variant="primary"
            loading={generate.isPending}
            onClick={() => generate.mutate(undefined, { onError: (err) => setError(err.message) })}
          >
            Build my story
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Your story</h2>
            <p className={styles.subtitle}>
              {chapters.length} chapters · about {formatDurationLong(Math.round(totalSeconds))}
            </p>
          </div>
          <div className={styles.headerActions}>
            <IconButton label="Undo last change" disabled={!story.canUndo || undo.isPending} onClick={() => undo.mutate()}>
              <IconUndo size={16} />
            </IconButton>
            <IconButton label="Redo" disabled={!story.canRedo || redo.isPending} onClick={() => redo.mutate()}>
              <IconRedo size={16} />
            </IconButton>
            <Button icon={<IconRefresh size={15} />} onClick={() => setConfirmRegenerate(true)}>
              Regenerate story
            </Button>
            <Button variant="primary" onClick={() => navigate(`/projects/${project.id}/editor`)}>
              Continue to first cut
            </Button>
          </div>
        </header>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className={styles.chapters}>
            {chapters.map((chapter, ci) => {
              const chapterSeconds = chapter.items.reduce((s, i) => s + i.durationSeconds, 0);
              return (
                <section key={chapter.id} className={styles.chapter} aria-label={chapter.title}>
                  <header className={styles.chapterHead}>
                    <div>
                      <h3 className={styles.chapterTitle}>
                        Chapter {ci + 1}: {chapter.title}
                      </h3>
                      {chapter.description && <p className={styles.chapterDesc}>{chapter.description}</p>}
                    </div>
                    <div className={styles.chapterMeta}>
                      <span className={styles.chapterDuration}>{formatDuration(chapterSeconds)}</span>
                      <IconButton
                        label={`Regenerate ${chapter.title}`}
                        onClick={() => generate.mutate({ chapterId: chapter.id })}
                      >
                        <IconRefresh size={14} />
                      </IconButton>
                      <IconButton label={`Add a title card to ${chapter.title}`} onClick={() => addTitleCard(chapter.id)}>
                        <IconPlus size={14} />
                      </IconButton>
                    </div>
                  </header>
                  <SortableContext items={chapter.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <ul className={styles.items}>
                      {chapter.items.map((item) => {
                        const highlight = item.highlightId ? highlightById.get(item.highlightId) : undefined;
                        return (
                          <ItemRow
                            key={item.id}
                            item={item}
                            chapters={chapters}
                            chapterId={chapter.id}
                            highlight={highlight}
                            media={highlight ? mediaById.get(highlight.mediaItemId) : undefined}
                            onChange={(patch) => updateItem(chapter.id, item.id, patch)}
                            onRemove={() => removeItem(chapter.id, item.id)}
                            onMove={(to) => moveItem(chapter.id, item.id, to)}
                            onReplace={() => setReplacing({ chapterId: chapter.id, itemId: item.id })}
                          />
                        );
                      })}
                    </ul>
                  </SortableContext>
                </section>
              );
            })}
          </div>
        </DndContext>
      </div>

      <aside className={styles.aside}>
        <RevisionAssistant projectId={project.id} suggestions={SUGGESTIONS} />
      </aside>

      <Modal
        open={replacing !== null}
        onClose={() => setReplacing(null)}
        title="Replace with another approved highlight"
        width={560}
      >
        {available.length === 0 ? (
          <p className={styles.noAvailable}>Every approved highlight is already in the story. Approve more on the Highlights page.</p>
        ) : (
          <ul className={styles.replaceList}>
            {available.map((h) => (
              <li key={h.id}>
                <button type="button" className={styles.replaceOption} onClick={() => replaceWith(h)}>
                  <MediaThumbnail
                    thumbnailUrl={mediaById.get(h.mediaItemId)?.thumbnailUrl}
                    alt={h.title}
                    size="sm"
                    timeRange={[h.startSeconds, h.endSeconds]}
                  />
                  <span>
                    <span className={styles.replaceTitle}>{h.title}</span>
                    <span className={styles.replaceMeta}>{categoryLabel(h.category)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerate the whole story?"
        message="Storyline will rebuild all chapters from your approved highlights. You can undo this afterward."
        confirmLabel="Regenerate"
        loading={generate.isPending}
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={() =>
          generate.mutate(undefined, {
            onSettled: () => setConfirmRegenerate(false),
            onError: (err) => setError(err.message),
          })
        }
      />
    </div>
  );
}
