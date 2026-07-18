import type { Revision, RevisionChange, StoryChapter } from "@storyline/shared";
import { getDb, newId, now } from "../db/db.js";

type RevisionRow = {
  id: string;
  project_id: string;
  prompt: string;
  summary: string;
  changes: string;
  proposed_chapters: string | null;
  status: string;
  created_at: string;
};

function rowToRevision(row: RevisionRow): Revision {
  return {
    id: row.id,
    projectId: row.project_id,
    prompt: row.prompt,
    summary: row.summary,
    changes: JSON.parse(row.changes) as RevisionChange[],
    proposedChapters: row.proposed_chapters
      ? (JSON.parse(row.proposed_chapters) as StoryChapter[])
      : undefined,
    status: row.status as Revision["status"],
    createdAt: row.created_at,
  };
}

export function listRevisions(projectId: string): Revision[] {
  const rows = getDb()
    .prepare("SELECT * FROM revisions WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as RevisionRow[];
  return rows.map(rowToRevision);
}

export function getRevision(id: string): Revision | null {
  const row = getDb().prepare("SELECT * FROM revisions WHERE id = ?").get(id) as RevisionRow | undefined;
  return row ? rowToRevision(row) : null;
}

export function createRevision(input: {
  projectId: string;
  prompt: string;
  summary: string;
  changes: RevisionChange[];
  proposedChapters: StoryChapter[];
}): Revision {
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO revisions (id, project_id, prompt, summary, changes, proposed_chapters, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'proposed', ?)`
    )
    .run(
      id,
      input.projectId,
      input.prompt,
      input.summary,
      JSON.stringify(input.changes),
      JSON.stringify(input.proposedChapters),
      now()
    );
  const revision = getRevision(id);
  if (!revision) throw new Error("failed to create revision");
  return revision;
}

export function setRevisionStatus(id: string, status: "applied" | "rejected"): Revision | null {
  getDb().prepare("UPDATE revisions SET status = ? WHERE id = ?").run(status, id);
  return getRevision(id);
}
