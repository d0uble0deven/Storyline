import { Router } from "express";
import * as projects from "../repositories/projects.js";
import { listMedia } from "../repositories/media.js";
import { latestJob } from "../repositories/jobs.js";
import { startAnalysis } from "../services/jobs.js";
import { AppError, notFound } from "../errors.js";

export const analysisRouter = Router();

analysisRouter.post("/projects/:projectId/analysis/start", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  if (listMedia(project.id).length === 0) {
    throw new AppError(400, "Add some videos first — there's nothing to analyze yet.");
  }
  res.status(202).json(startAnalysis(project.id));
});

analysisRouter.get("/projects/:projectId/analysis/status", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  res.json(latestJob(project.id, "analysis"));
});
