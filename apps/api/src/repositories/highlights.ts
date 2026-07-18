import type {
  Highlight,
  HighlightCategory,
  HighlightPriority,
  HighlightScores,
  HighlightStatus,
} from "@storyline/shared";
import { getDb, newId, now } from "../db/db.js";

type HighlightRow = {
  id: string;
  project_id: string;
  media_item_id: string;
  title: string;
  description: string;
  category: string;
  start_seconds: number;
  end_seconds: number;
  ai_start_seconds: number;
  ai_end_seconds: number;
  status: string;
  priority: string;
  is_favorite: number;
  user_note: string | null;
  scores: string;
  ai_reasoning: string;
  created_at: string;
  updated_at: string;
};

function rowToHighlight(row: HighlightRow): Highlight {
  return {
    id: row.id,
    projectId: row.project_id,
    mediaItemId: row.media_item_id,
    title: row.title,
    description: row.description,
    category: row.category as HighlightCategory,
    startSeconds: row.start_seconds,
    endSeconds: row.end_seconds,
    aiStartSeconds: row.ai_start_seconds,
    aiEndSeconds: row.ai_end_seconds,
    status: row.status as HighlightStatus,
    priority: row.priority as HighlightPriority,
    isFavorite: row.is_favorite === 1,
    userNote: row.user_note ?? undefined,
    scores: JSON.parse(row.scores) as HighlightScores,
    aiReasoning: row.ai_reasoning,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listHighlights(projectId: string): Highlight[] {
  const rows = getDb()
    .prepare(
      `SELECT h.* FROM highlights h
       LEFT JOIN media_items m ON m.id = h.media_item_id
       WHERE h.project_id = ?
       ORDER BY m.recorded_at ASC, h.start_seconds ASC`
    )
    .all(projectId) as HighlightRow[];
  return rows.map(rowToHighlight);
}

export function getHighlight(id: string): Highlight | null {
  const row = getDb().prepare("SELECT * FROM highlights WHERE id = ?").get(id) as HighlightRow | undefined;
  return row ? rowToHighlight(row) : null;
}

export type HighlightDraft = {
  projectId: string;
  mediaItemId: string;
  title: string;
  description: string;
  category: HighlightCategory;
  startSeconds: number;
  endSeconds: number;
  status?: HighlightStatus;
  priority?: HighlightPriority;
  isFavorite?: boolean;
  userNote?: string;
  scores: HighlightScores;
  aiReasoning: string;
};

export function createHighlight(draft: HighlightDraft): Highlight {
  const id = newId();
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO highlights
       (id, project_id, media_item_id, title, description, category, start_seconds, end_seconds,
        ai_start_seconds, ai_end_seconds, status, priority, is_favorite, user_note, scores, ai_reasoning,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      draft.projectId,
      draft.mediaItemId,
      draft.title,
      draft.description,
      draft.category,
      draft.startSeconds,
      draft.endSeconds,
      draft.startSeconds,
      draft.endSeconds,
      draft.status ?? "suggested",
      draft.priority ?? "normal",
      draft.isFavorite ? 1 : 0,
      draft.userNote ?? null,
      JSON.stringify(draft.scores),
      draft.aiReasoning,
      ts,
      ts
    );
  const highlight = getHighlight(id);
  if (!highlight) throw new Error("failed to create highlight");
  return highlight;
}

export type HighlightPatch = Partial<
  Pick<
    Highlight,
    | "title"
    | "status"
    | "priority"
    | "category"
    | "isFavorite"
    | "userNote"
    | "startSeconds"
    | "endSeconds"
  >
> & { restoreAiTrim?: boolean };

export function updateHighlight(id: string, patch: HighlightPatch): Highlight | null {
  const existing = getHighlight(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  if (patch.restoreAiTrim) {
    merged.startSeconds = existing.aiStartSeconds;
    merged.endSeconds = existing.aiEndSeconds;
  }
  if (merged.endSeconds <= merged.startSeconds) {
    merged.endSeconds = merged.startSeconds + 1;
  }
  getDb()
    .prepare(
      `UPDATE highlights SET title = ?, status = ?, priority = ?, category = ?, is_favorite = ?,
       user_note = ?, start_seconds = ?, end_seconds = ?, updated_at = ? WHERE id = ?`
    )
    .run(
      merged.title,
      merged.status,
      merged.priority,
      merged.category,
      merged.isFavorite ? 1 : 0,
      merged.userNote ?? null,
      merged.startSeconds,
      merged.endSeconds,
      now(),
      id
    );
  return getHighlight(id);
}

export function countHighlights(projectId: string): number {
  return (
    getDb().prepare("SELECT COUNT(*) AS n FROM highlights WHERE project_id = ?").get(projectId) as {
      n: number;
    }
  ).n;
}

export function highlightsForMedia(mediaItemId: string): Highlight[] {
  const rows = getDb()
    .prepare("SELECT * FROM highlights WHERE media_item_id = ?")
    .all(mediaItemId) as HighlightRow[];
  return rows.map(rowToHighlight);
}
