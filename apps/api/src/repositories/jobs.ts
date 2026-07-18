import type { ExportConfig, ExportResult, Job, JobFinding, JobStatus, JobType } from "@storyline/shared";
import { getDb, newId, now } from "../db/db.js";

type JobRow = {
  id: string;
  project_id: string;
  type: string;
  status: string;
  phases: string;
  phase_index: number;
  progress: number;
  findings: string;
  payload: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
};

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type as JobType,
    status: row.status as JobStatus,
    phases: JSON.parse(row.phases) as string[],
    phaseIndex: row.phase_index,
    progress: row.progress,
    findings: JSON.parse(row.findings) as JobFinding[],
    payload: row.payload ? (JSON.parse(row.payload) as ExportConfig) : undefined,
    result: row.result ? (JSON.parse(row.result) as ExportResult) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createJob(input: {
  projectId: string;
  type: JobType;
  phases: string[];
  payload?: ExportConfig;
}): Job {
  const id = newId();
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO jobs (id, project_id, type, status, phases, phase_index, progress, findings, payload, created_at, updated_at)
       VALUES (?, ?, ?, 'running', ?, 0, 0, '[]', ?, ?, ?)`
    )
    .run(id, input.projectId, input.type, JSON.stringify(input.phases), input.payload ? JSON.stringify(input.payload) : null, ts, ts);
  const job = getJob(id);
  if (!job) throw new Error("failed to create job");
  return job;
}

export function getJob(id: string): Job | null {
  const row = getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
  return row ? rowToJob(row) : null;
}

export function latestJob(projectId: string, type: JobType): Job | null {
  const row = getDb()
    .prepare("SELECT * FROM jobs WHERE project_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1")
    .get(projectId, type) as JobRow | undefined;
  return row ? rowToJob(row) : null;
}

export function listRunningJobs(): Job[] {
  const rows = getDb().prepare("SELECT * FROM jobs WHERE status = 'running'").all() as JobRow[];
  return rows.map(rowToJob);
}

export function updateJob(
  id: string,
  patch: Partial<{
    status: JobStatus;
    phaseIndex: number;
    progress: number;
    findings: JobFinding[];
    result: ExportResult;
  }>
): Job | null {
  const existing = getJob(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  getDb()
    .prepare(
      "UPDATE jobs SET status = ?, phase_index = ?, progress = ?, findings = ?, result = ?, updated_at = ? WHERE id = ?"
    )
    .run(
      merged.status,
      merged.phaseIndex,
      merged.progress,
      JSON.stringify(merged.findings),
      merged.result ? JSON.stringify(merged.result) : null,
      now(),
      id
    );
  return getJob(id);
}
