import path from "node:path";
import { existsSync, statSync } from "node:fs";
import type { ExportConfig, ExportResult, Job } from "@storyline/shared";
import { ANALYSIS_PHASES, EXPORT_PHASES } from "@storyline/shared";
import { UPLOADS_DIR } from "../db/db.js";
import * as jobs from "../repositories/jobs.js";
import * as projects from "../repositories/projects.js";
import { markAllAnalyzed } from "../repositories/media.js";
import { createHighlight } from "../repositories/highlights.js";
import { getStory } from "../repositories/stories.js";
import { storyDurationSeconds } from "./ai/mockStoryEditor.js";
import { getCurator } from "./ai/index.js";

const TICK_MS = Number(process.env.JOB_TICK_MS ?? 900);
const STEP = Number(process.env.JOB_STEP ?? 6);

export const PLACEHOLDER_MP4 = path.join(UPLOADS_DIR, "placeholder", "storyline-final.mp4");

export function startAnalysis(projectId: string): Job {
  const running = jobs.latestJob(projectId, "analysis");
  if (running && running.status === "running") return running;
  return jobs.createJob({ projectId, type: "analysis", phases: ANALYSIS_PHASES });
}

export function startExport(projectId: string, config: ExportConfig): Job {
  const running = jobs.latestJob(projectId, "export");
  if (running && running.status === "running") return running;
  return jobs.createJob({ projectId, type: "export", phases: EXPORT_PHASES, payload: config });
}

function resolutionDims(config: ExportConfig): { width: number; height: number } {
  const long = config.resolution === "720p" ? 1280 : config.resolution === "1080p" ? 1920 : 3840;
  const short = config.resolution === "720p" ? 720 : config.resolution === "1080p" ? 1080 : 2160;
  if (config.aspect === "16:9") return { width: long, height: short };
  if (config.aspect === "9:16") return { width: short, height: long };
  return { width: short, height: short };
}

function completeJob(job: Job): void {
  if (job.type === "analysis") {
    const curated = getCurator().analyzeProject(job.projectId);
    for (const c of curated) {
      // A fresh analysis always proposes; review states are the user's job.
      createHighlight({ ...c, status: "suggested", priority: "normal" });
    }
    markAllAnalyzed(job.projectId);
    projects.advanceStage(job.projectId, "highlights");
  } else {
    const config = (job.payload ?? { aspect: "16:9", resolution: "1080p", format: "mp4" }) as ExportConfig;
    const story = getStory(job.projectId);
    const durationSeconds = story ? storyDurationSeconds(story.chapters) : 240;
    const { width, height } = resolutionDims(config);
    const bytesPerSecond = config.resolution === "720p" ? 750_000 : config.resolution === "1080p" ? 1_500_000 : 6_000_000;
    let fileSizeBytes = durationSeconds * bytesPerSecond;
    if (existsSync(PLACEHOLDER_MP4)) {
      // If we have a real placeholder file, report a size in its ballpark so the demo stays honest.
      fileSizeBytes = Math.max(statSync(PLACEHOLDER_MP4).size, 1024);
    }
    const result: ExportResult = {
      downloadUrl: `/api/exports/${job.id}/download`,
      fileSizeBytes,
      durationSeconds,
      width,
      height,
      completedAt: new Date().toISOString(),
    };
    jobs.updateJob(job.id, { result });
    projects.advanceStage(job.projectId, "finish");
  }
}

/** Advance every running job one tick. Exported so tests can drive time manually. */
export function tickJobs(step = STEP): void {
  for (const job of jobs.listRunningJobs()) {
    const progress = Math.min(100, job.progress + step);
    const phaseCount = job.phases.length;
    const phaseIndex = Math.min(phaseCount - 1, Math.floor((progress / 100) * phaseCount));
    const findings = [...job.findings];

    if (job.type === "analysis" && phaseIndex > job.phaseIndex) {
      const pool = getCurator().findingsFor(job.projectId);
      const idx = findings.length;
      if (idx < pool.length) {
        findings.push({ at: new Date().toISOString(), message: pool[idx] });
      }
    }

    if (progress >= 100) {
      const finished = jobs.updateJob(job.id, {
        progress: 100,
        phaseIndex: phaseCount - 1,
        findings,
        status: "complete",
      });
      if (finished) completeJob(finished);
    } else {
      jobs.updateJob(job.id, { progress, phaseIndex, findings });
    }
  }
}

let ticker: ReturnType<typeof setInterval> | null = null;

export function startJobTicker(): void {
  if (ticker) return;
  ticker = setInterval(() => {
    try {
      tickJobs();
    } catch (err) {
      console.error("job ticker error", err);
    }
  }, TICK_MS);
  ticker.unref?.();
}

export function stopJobTicker(): void {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}
