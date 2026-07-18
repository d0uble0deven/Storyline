import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const API_ROOT = path.resolve(import.meta.dirname, "..", "..");
export const UPLOADS_DIR = path.join(API_ROOT, "uploads");
export const DATA_DIR = path.join(API_ROOT, "data");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  story_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_stage TEXT NOT NULL DEFAULT 'media',
  creative_brief TEXT,
  production_plan TEXT,
  post_production TEXT NOT NULL,
  cover_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  source TEXT NOT NULL,
  storage_path TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  duration_seconds REAL,
  recorded_at TEXT,
  uploaded_at TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'ready',
  notes TEXT,
  is_important INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_media_project ON media_items(project_id);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  media_item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  start_seconds REAL NOT NULL,
  end_seconds REAL NOT NULL,
  ai_start_seconds REAL NOT NULL,
  ai_end_seconds REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'suggested',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  user_note TEXT,
  scores TEXT NOT NULL,
  ai_reasoning TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_highlights_project ON highlights(project_id);

CREATE TABLE IF NOT EXISTS stories (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  chapters TEXT NOT NULL,
  undo_stack TEXT NOT NULL DEFAULT '[]',
  redo_stack TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  summary TEXT NOT NULL,
  changes TEXT NOT NULL,
  proposed_chapters TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_project ON revisions(project_id);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  phases TEXT NOT NULL,
  phase_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  findings TEXT NOT NULL DEFAULT '[]',
  payload TEXT,
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON jobs(project_id);
`;

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = process.env.STORYLINE_DB_PATH ?? path.join(DATA_DIR, "storyline.db");
  if (dbPath !== ":memory:") {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

/** Test helper: close and forget the current connection so a fresh DB can be opened. */
export function resetDbForTests(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function now(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
