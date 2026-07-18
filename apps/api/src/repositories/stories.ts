import type { Story, StoryChapter } from "@storyline/shared";
import { getDb, now } from "../db/db.js";

const MAX_HISTORY = 20;

type StoryRow = {
  project_id: string;
  chapters: string;
  undo_stack: string;
  redo_stack: string;
  updated_at: string;
};

function rowToStory(row: StoryRow): Story {
  const undoStack = JSON.parse(row.undo_stack) as StoryChapter[][];
  const redoStack = JSON.parse(row.redo_stack) as StoryChapter[][];
  return {
    projectId: row.project_id,
    chapters: JSON.parse(row.chapters) as StoryChapter[],
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    updatedAt: row.updated_at,
  };
}

export function getStory(projectId: string): Story | null {
  const row = getDb().prepare("SELECT * FROM stories WHERE project_id = ?").get(projectId) as
    | StoryRow
    | undefined;
  return row ? rowToStory(row) : null;
}

/** Replace the story. Unless transient, the previous chapters go onto the undo stack. */
export function saveStory(projectId: string, chapters: StoryChapter[], opts?: { transient?: boolean }): Story {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM stories WHERE project_id = ?").get(projectId) as
    | StoryRow
    | undefined;
  const ts = now();
  if (!existing) {
    db.prepare(
      "INSERT INTO stories (project_id, chapters, undo_stack, redo_stack, updated_at) VALUES (?, ?, '[]', '[]', ?)"
    ).run(projectId, JSON.stringify(chapters), ts);
  } else if (opts?.transient) {
    db.prepare("UPDATE stories SET chapters = ?, updated_at = ? WHERE project_id = ?").run(
      JSON.stringify(chapters),
      ts,
      projectId
    );
  } else {
    const undoStack = JSON.parse(existing.undo_stack) as StoryChapter[][];
    undoStack.push(JSON.parse(existing.chapters) as StoryChapter[]);
    while (undoStack.length > MAX_HISTORY) undoStack.shift();
    db.prepare(
      "UPDATE stories SET chapters = ?, undo_stack = ?, redo_stack = '[]', updated_at = ? WHERE project_id = ?"
    ).run(JSON.stringify(chapters), JSON.stringify(undoStack), ts, projectId);
  }
  const story = getStory(projectId);
  if (!story) throw new Error("failed to save story");
  return story;
}

export function undoStory(projectId: string): Story | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM stories WHERE project_id = ?").get(projectId) as
    | StoryRow
    | undefined;
  if (!row) return null;
  const undoStack = JSON.parse(row.undo_stack) as StoryChapter[][];
  if (undoStack.length === 0) return rowToStory(row);
  const previous = undoStack.pop()!;
  const redoStack = JSON.parse(row.redo_stack) as StoryChapter[][];
  redoStack.push(JSON.parse(row.chapters) as StoryChapter[]);
  db.prepare(
    "UPDATE stories SET chapters = ?, undo_stack = ?, redo_stack = ?, updated_at = ? WHERE project_id = ?"
  ).run(JSON.stringify(previous), JSON.stringify(undoStack), JSON.stringify(redoStack), now(), projectId);
  return getStory(projectId);
}

export function redoStory(projectId: string): Story | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM stories WHERE project_id = ?").get(projectId) as
    | StoryRow
    | undefined;
  if (!row) return null;
  const redoStack = JSON.parse(row.redo_stack) as StoryChapter[][];
  if (redoStack.length === 0) return rowToStory(row);
  const next = redoStack.pop()!;
  const undoStack = JSON.parse(row.undo_stack) as StoryChapter[][];
  undoStack.push(JSON.parse(row.chapters) as StoryChapter[]);
  db.prepare(
    "UPDATE stories SET chapters = ?, undo_stack = ?, redo_stack = ?, updated_at = ? WHERE project_id = ?"
  ).run(JSON.stringify(next), JSON.stringify(undoStack), JSON.stringify(redoStack), now(), projectId);
  return getStory(projectId);
}
