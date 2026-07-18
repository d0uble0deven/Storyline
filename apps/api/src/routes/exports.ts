import { Router } from "express";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { exportRequestSchema } from "@storyline/shared";
import * as projects from "../repositories/projects.js";
import * as stories from "../repositories/stories.js";
import { listHighlights } from "../repositories/highlights.js";
import { getJob, latestJob } from "../repositories/jobs.js";
import { PLACEHOLDER_MP4, startExport } from "../services/jobs.js";
import { buildRenderPlan } from "../services/renderPlan.js";
import { AppError, notFound } from "../errors.js";
import { parse } from "../validate.js";

export const exportsRouter = Router();

exportsRouter.post("/projects/:projectId/export", (req, res) => {
  const config = parse(exportRequestSchema, req.body);
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  if (!stories.getStory(project.id)) {
    throw new AppError(400, "Build your story before exporting — there's nothing to render yet.");
  }
  res.status(202).json(startExport(project.id, config));
});

exportsRouter.get("/projects/:projectId/export/latest", (req, res) => {
  if (!projects.getProject(req.params.projectId)) throw notFound("Project");
  res.json(latestJob(req.params.projectId, "export"));
});

exportsRouter.get("/projects/:projectId/export/:exportId/status", (req, res) => {
  const job = getJob(req.params.exportId);
  if (!job || job.projectId !== req.params.projectId) throw notFound("Export");
  res.json(job);
});

exportsRouter.get("/projects/:projectId/render-plan", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  const story = stories.getStory(project.id);
  if (!story) throw new AppError(400, "Build your story first.");
  res.json(buildRenderPlan(project, story, listHighlights(project.id)));
});

exportsRouter.get("/exports/:exportId/download", (req, res) => {
  const job = getJob(req.params.exportId);
  if (!job || job.type !== "export" || job.status !== "complete") throw notFound("Export");
  const project = projects.getProject(job.projectId);
  const nice = (project?.name ?? "storyline").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!existsSync(PLACEHOLDER_MP4)) {
    // Last-resort stub so the download flow always completes in the MVP.
    mkdirSync(path.dirname(PLACEHOLDER_MP4), { recursive: true });
    writeFileSync(PLACEHOLDER_MP4, "Storyline placeholder render. Real encoding arrives with the media engine.");
  }
  res.download(PLACEHOLDER_MP4, `${nice}.mp4`);
});
