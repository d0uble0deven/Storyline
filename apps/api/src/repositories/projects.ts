import type {
  CreativeBrief,
  PostProductionSettings,
  ProductionPlan,
  Project,
  ProjectStage,
  ProjectStats,
  ProjectSummary,
  ProjectStatus,
  StoryType,
} from "@storyline/shared";
import { defaultPostProduction, stageIndex, PROJECT_STAGES } from "@storyline/shared";
import { getDb, newId, now } from "../db/db.js";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  story_type: string;
  status: string;
  current_stage: string;
  creative_brief: string | null;
  production_plan: string | null;
  post_production: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    storyType: row.story_type as StoryType,
    status: row.status as ProjectStatus,
    currentStage: row.current_stage as ProjectStage,
    creativeBrief: row.creative_brief ? (JSON.parse(row.creative_brief) as CreativeBrief) : undefined,
    productionPlan: row.production_plan ? (JSON.parse(row.production_plan) as ProductionPlan) : undefined,
    postProduction: JSON.parse(row.post_production) as PostProductionSettings,
    coverUrl: row.cover_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(): Project[] {
  const rows = getDb().prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProject(id: string): Project | null {
  const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : null;
}

export function createProject(input: {
  name: string;
  description?: string;
  storyType: StoryType;
}): Project {
  const id = newId();
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO projects (id, name, description, story_type, status, current_stage, post_production, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', 'media', ?, ?, ?)`
    )
    .run(id, input.name, input.description ?? null, input.storyType, JSON.stringify(defaultPostProduction()), ts, ts);
  const project = getProject(id);
  if (!project) throw new Error("failed to create project");
  return project;
}

export function updateProject(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    storyType: StoryType;
    status: ProjectStatus;
    currentStage: ProjectStage;
    creativeBrief: CreativeBrief;
    productionPlan: ProductionPlan;
    postProduction: PostProductionSettings;
    coverUrl: string;
  }>
): Project | null {
  const existing = getProject(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  getDb()
    .prepare(
      `UPDATE projects SET name = ?, description = ?, story_type = ?, status = ?, current_stage = ?,
       creative_brief = ?, production_plan = ?, post_production = ?, cover_url = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      merged.name,
      merged.description ?? null,
      merged.storyType,
      merged.status,
      merged.currentStage,
      merged.creativeBrief ? JSON.stringify(merged.creativeBrief) : null,
      merged.productionPlan ? JSON.stringify(merged.productionPlan) : null,
      JSON.stringify(merged.postProduction),
      merged.coverUrl ?? null,
      now(),
      id
    );
  return getProject(id);
}

/** Move the project stage forward; never moves it backward. */
export function advanceStage(id: string, stage: ProjectStage): Project | null {
  const project = getProject(id);
  if (!project) return null;
  if (stageIndex(stage) <= stageIndex(project.currentStage)) return project;
  const status: ProjectStatus = stage === "finish" ? "complete" : "in-progress";
  return updateProject(id, { currentStage: stage, status });
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getProjectStats(id: string): ProjectStats {
  const db = getDb();
  const mediaCount = (
    db.prepare("SELECT COUNT(*) AS n FROM media_items WHERE project_id = ?").get(id) as { n: number }
  ).n;
  const rows = db
    .prepare(
      `SELECT status, priority, start_seconds, end_seconds FROM highlights WHERE project_id = ?`
    )
    .all(id) as { status: string; priority: string; start_seconds: number; end_seconds: number }[];
  const stats: ProjectStats = {
    mediaCount,
    totalHighlights: rows.length,
    approved: 0,
    rejected: 0,
    suggested: 0,
    essential: 0,
    approvedDurationSeconds: 0,
  };
  for (const r of rows) {
    if (r.status === "approved") {
      stats.approved += 1;
      stats.approvedDurationSeconds += Math.max(0, r.end_seconds - r.start_seconds);
    } else if (r.status === "rejected") stats.rejected += 1;
    else stats.suggested += 1;
    if (r.priority === "essential" && r.status !== "rejected") stats.essential += 1;
  }
  stats.approvedDurationSeconds = Math.round(stats.approvedDurationSeconds);
  return stats;
}

export function toSummary(project: Project): ProjectSummary {
  const stats = getProjectStats(project.id);
  const progressPercent = Math.round(
    (stageIndex(project.currentStage) / (PROJECT_STAGES.length - 1)) * 100
  );
  return { ...project, stats, progressPercent };
}
