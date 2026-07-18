import type { MediaItem, MediaSource, MediaStatus } from "@storyline/shared";
import { getDb, newId, now } from "../db/db.js";

type MediaRow = {
  id: string;
  project_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  source: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  uploaded_at: string;
  width: number | null;
  height: number | null;
  status: string;
  notes: string | null;
  is_important: number;
};

function rowToMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    projectId: row.project_id,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    source: row.source as MediaSource,
    storagePath: row.storage_path ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    previewUrl: row.preview_url ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    recordedAt: row.recorded_at ?? undefined,
    uploadedAt: row.uploaded_at,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    status: row.status as MediaStatus,
    notes: row.notes ?? undefined,
    isImportant: row.is_important === 1,
  };
}

export function listMedia(projectId: string): MediaItem[] {
  const rows = getDb()
    .prepare("SELECT * FROM media_items WHERE project_id = ? ORDER BY recorded_at ASC, uploaded_at ASC")
    .all(projectId) as MediaRow[];
  return rows.map(rowToMedia);
}

export function getMedia(id: string): MediaItem | null {
  const row = getDb().prepare("SELECT * FROM media_items WHERE id = ?").get(id) as MediaRow | undefined;
  return row ? rowToMedia(row) : null;
}

export function createMedia(input: Omit<MediaItem, "id" | "uploadedAt" | "isImportant"> & {
  id?: string;
  uploadedAt?: string;
  isImportant?: boolean;
}): MediaItem {
  const id = input.id ?? newId();
  getDb()
    .prepare(
      `INSERT INTO media_items
       (id, project_id, filename, original_filename, mime_type, source, storage_path, thumbnail_url,
        preview_url, duration_seconds, recorded_at, uploaded_at, width, height, status, notes, is_important)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.projectId,
      input.filename,
      input.originalFilename,
      input.mimeType,
      input.source,
      input.storagePath ?? null,
      input.thumbnailUrl ?? null,
      input.previewUrl ?? null,
      input.durationSeconds ?? null,
      input.recordedAt ?? null,
      input.uploadedAt ?? now(),
      input.width ?? null,
      input.height ?? null,
      input.status,
      input.notes ?? null,
      input.isImportant ? 1 : 0
    );
  const media = getMedia(id);
  if (!media) throw new Error("failed to create media item");
  return media;
}

export function updateMedia(
  id: string,
  patch: Partial<Pick<MediaItem, "notes" | "isImportant" | "recordedAt" | "status">>
): MediaItem | null {
  const existing = getMedia(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  getDb()
    .prepare("UPDATE media_items SET notes = ?, is_important = ?, recorded_at = ?, status = ? WHERE id = ?")
    .run(merged.notes ?? null, merged.isImportant ? 1 : 0, merged.recordedAt ?? null, merged.status, id);
  return getMedia(id);
}

export function markAllAnalyzed(projectId: string): void {
  getDb()
    .prepare("UPDATE media_items SET status = 'analyzed' WHERE project_id = ? AND status IN ('ready', 'processing')")
    .run(projectId);
}

export function deleteMedia(id: string): boolean {
  getDb().prepare("DELETE FROM highlights WHERE media_item_id = ?").run(id);
  const result = getDb().prepare("DELETE FROM media_items WHERE id = ?").run(id);
  return result.changes > 0;
}
