import { useMemo, useState } from "react";
import type { MediaItem, MediaSource } from "@storyline/shared";
import { useQueryClient } from "@tanstack/react-query";
import { keys, useDeleteMedia, useMedia, usePatchMedia } from "../../api/hooks.js";
import { uploadMediaFile } from "../../api/client.js";
import { probeVideoFile } from "../../lib/videoProbe.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Select } from "../../components/atoms/Select.js";
import { Progress } from "../../components/atoms/Progress.js";
import { Textarea } from "../../components/atoms/Textarea.js";
import { Toggle } from "../../components/atoms/Toggle.js";
import { SearchField } from "../../components/molecules/SearchField.js";
import { UploadDropzone } from "../../components/molecules/UploadDropzone.js";
import { MediaThumbnail } from "../../components/molecules/MediaThumbnail.js";
import { MediaStatusBadge } from "../../components/molecules/StatusBadge.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { Modal, ConfirmDialog } from "../../components/molecules/Modal.js";
import { IconCloud, IconFilm, IconStar, IconUpload, IconWarning } from "../../components/icons.js";
import { formatDate, formatDuration, pluralize } from "../../lib/format.js";
import styles from "./MediaLibrary.module.css";

type UploadTask = { id: string; name: string; percent: number; error?: string };

const CONNECTORS = [
  { id: "google-photos", label: "Google Photos", blurb: "Pick from your library" },
  { id: "google-drive", label: "Google Drive", blurb: "Import from Drive folders" },
  { id: "dropbox", label: "Dropbox", blurb: "Import from Dropbox" },
] as const;

export function MediaLibrary() {
  const { project } = useProjectContext();
  const qc = useQueryClient();
  const { data: media, isLoading } = useMedia(project.id);
  const patchMedia = usePatchMedia(project.id);
  const deleteMedia = useDeleteMedia(project.id);

  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | MediaSource>("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<MediaItem | null>(null);
  const [toRemove, setToRemove] = useState<MediaItem[] | null>(null);
  const [connector, setConnector] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const startUploads = (files: File[]) => {
    setRejection(null);
    for (const file of files) {
      const taskId = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id: taskId, name: file.name, percent: 0 }]);
      void (async () => {
        const meta = await probeVideoFile(file);
        try {
          await uploadMediaFile(project.id, file, { ...meta, recordedAt: new Date(file.lastModified).toISOString() }, (percent) =>
            setUploads((u) => u.map((t) => (t.id === taskId ? { ...t, percent } : t)))
          );
          setUploads((u) => u.filter((t) => t.id !== taskId));
          void qc.invalidateQueries({ queryKey: keys.media(project.id) });
          void qc.invalidateQueries({ queryKey: keys.project(project.id) });
        } catch (err) {
          setUploads((u) =>
            u.map((t) => (t.id === taskId ? { ...t, error: err instanceof Error ? err.message : "Upload failed" } : t))
          );
        }
      })();
    }
  };

  const filtered = useMemo(() => {
    let list = media ?? [];
    if (search) list = list.filter((m) => m.originalFilename.toLowerCase().includes(search.toLowerCase()));
    if (sourceFilter !== "all") list = list.filter((m) => m.source === sourceFilter);
    return [...list].sort((a, b) => {
      const ka = a.recordedAt ?? a.uploadedAt;
      const kb = b.recordedAt ?? b.uploadedAt;
      return sortDir === "asc" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
  }, [media, search, sourceFilter, sortDir]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Media library</h2>
          <p className={styles.subtitle}>
            {pluralize(media?.length ?? 0, "video")} · Your videos remain private and are only used to create your
            Storyline project.
          </p>
        </div>
      </header>

      <section className={styles.addRow} aria-label="Add media">
        <div className={styles.dropWrap}>
          <UploadDropzone onFiles={startUploads} onRejected={setRejection} />
          {rejection && (
            <p className={styles.rejection} role="alert">
              <IconWarning size={14} /> {rejection}
            </p>
          )}
        </div>
        <div className={styles.connectors}>
          {CONNECTORS.map((c) => (
            <button key={c.id} type="button" className={styles.connector} onClick={() => setConnector(c.label)}>
              <IconCloud size={18} />
              <span>
                <span className={styles.connectorLabel}>{c.label}</span>
                <span className={styles.connectorBlurb}>{c.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {uploads.length > 0 && (
        <section className={styles.uploads} aria-label="Uploads in progress">
          {uploads.map((task) => (
            <div key={task.id} className={styles.uploadRow}>
              <IconUpload size={15} />
              <span className={styles.uploadName}>{task.name}</span>
              {task.error ? (
                <>
                  <span className={styles.uploadError}>{task.error}</span>
                  <Button size="sm" variant="ghost" onClick={() => setUploads((u) => u.filter((t) => t.id !== task.id))}>
                    Dismiss
                  </Button>
                </>
              ) : (
                <>
                  <Progress value={task.percent} label={`Uploading ${task.name}`} size="sm" />
                  <span className={styles.uploadPct}>{task.percent}%</span>
                </>
              )}
            </div>
          ))}
        </section>
      )}

      <div className={styles.toolbar}>
        <SearchField value={search} onChange={setSearch} placeholder="Search filenames" />
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as "all" | MediaSource)} aria-label="Filter by source">
          <option value="all">All sources</option>
          <option value="upload">Uploaded</option>
          <option value="sample">Sample</option>
        </Select>
        <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")} aria-label="Sort by date">
          <option value="asc">Oldest first</option>
          <option value="desc">Newest first</option>
        </Select>
        <div className={styles.viewToggle} role="group" aria-label="View">
          <Button size="sm" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")}>
            Grid
          </Button>
          <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}>
            List
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span>{pluralize(selected.size, "video")} selected</span>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setToRemove((media ?? []).filter((m) => selected.has(m.id)))}
          >
            Remove selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {!isLoading && filtered.length === 0 && uploads.length === 0 && (
        <EmptyState
          icon={<IconFilm size={24} />}
          title="No videos yet"
          message="Drag in the clips from your phone or camera — even the shaky ones. The story is often hiding in them."
        />
      )}

      <ul className={view === "grid" ? styles.grid : styles.list}>
        {filtered.map((item) => (
          <li key={item.id} className={styles.mediaItem}>
            <button type="button" className={styles.mediaCard} onClick={() => setDetail(item)}>
              <span className={styles.thumbBox}>
                <MediaThumbnail
                  thumbnailUrl={item.thumbnailUrl}
                  alt={item.originalFilename}
                  durationSeconds={item.durationSeconds}
                  size={view === "grid" ? "md" : "sm"}
                />
                {item.isImportant && (
                  <span className={styles.importantStar} title="Marked important">
                    <IconStar size={13} />
                  </span>
                )}
              </span>
              <span className={styles.mediaMeta}>
                <span className={styles.mediaName}>{item.originalFilename}</span>
                <span className={styles.mediaSub}>
                  {formatDate(item.recordedAt)} · {formatDuration(item.durationSeconds)} ·{" "}
                  {item.source === "sample" ? "Sample" : "Uploaded"}
                </span>
                <MediaStatusBadge status={item.status} />
              </span>
            </button>
            <span className={styles.selectBox}>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                aria-label={`Select ${item.originalFilename}`}
              />
            </span>
          </li>
        ))}
      </ul>

      {/* Detail drawer */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.originalFilename ?? "Video details"}
        width={520}
      >
        {detail && (
          <div className={styles.detail}>
            {detail.previewUrl ? (
              <video src={detail.previewUrl} controls className={styles.detailVideo} poster={detail.thumbnailUrl}>
                <track kind="captions" label="Captions coming soon" />
              </video>
            ) : (
              <MediaThumbnail thumbnailUrl={detail.thumbnailUrl} alt={detail.originalFilename} durationSeconds={detail.durationSeconds} size="lg" />
            )}
            <dl className={styles.detailMeta}>
              <div><dt>Recorded</dt><dd>{formatDate(detail.recordedAt)}</dd></div>
              <div><dt>Duration</dt><dd>{formatDuration(detail.durationSeconds)}</dd></div>
              <div><dt>Size</dt><dd>{detail.width && detail.height ? `${detail.width}×${detail.height}` : "Unknown"}</dd></div>
              <div><dt>Source</dt><dd>{detail.source === "sample" ? "Sample footage" : "Uploaded from device"}</dd></div>
            </dl>
            <Toggle
              checked={detail.isImportant}
              label="Mark as important"
              hint="Storyline gives important clips extra weight when choosing highlights."
              onChange={(isImportant) => {
                setDetail({ ...detail, isImportant });
                patchMedia.mutate({ id: detail.id, isImportant });
              }}
            />
            <div>
              <p className={styles.noteLabel}>Notes</p>
              <Textarea
                defaultValue={detail.notes ?? ""}
                rows={2}
                placeholder="Anything Storyline should know about this clip…"
                onBlur={(e) => patchMedia.mutate({ id: detail.id, notes: e.target.value })}
              />
            </div>
            <div className={styles.detailActions}>
              <Button variant="danger" onClick={() => { setToRemove([detail]); setDetail(null); }}>
                Remove from project
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Connector placeholder */}
      <Modal open={connector !== null} onClose={() => setConnector(null)} title={`Connect ${connector ?? ""}`} width={440}>
        <div className={styles.comingSoon}>
          <IconCloud size={28} />
          <p>
            <strong>{connector}</strong> support is coming soon. Storyline will use secure, permission-based access —
            you pick exactly which videos to share, and access can be revoked at any time.
          </p>
          <Button variant="primary" onClick={() => setConnector(null)}>Got it</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={toRemove !== null}
        title={`Remove ${toRemove?.length === 1 ? "this video" : `${toRemove?.length ?? 0} videos`}?`}
        message="The videos and any highlights found in them will be removed from this project."
        confirmLabel="Remove"
        danger
        loading={deleteMedia.isPending}
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          for (const item of toRemove ?? []) deleteMedia.mutate(item.id);
          setSelected(new Set());
          setToRemove(null);
        }}
      />
    </div>
  );
}
