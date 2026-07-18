import { Router } from "express";
import { briefSchema } from "@storyline/shared";
import * as projects from "../repositories/projects.js";
import { notFound } from "../errors.js";
import { parse } from "../validate.js";

export const briefRouter = Router();

briefRouter.get("/projects/:projectId/brief", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  res.json(project.creativeBrief ?? null);
});

briefRouter.put("/projects/:projectId/brief", (req, res) => {
  const brief = parse(briefSchema, req.body);
  const project = projects.updateProject(req.params.projectId, { creativeBrief: brief });
  if (!project) throw notFound("Project");
  if (brief.overview.trim().length > 0) {
    projects.advanceStage(project.id, "brief");
  }
  res.json(brief);
});
