import { Router } from "express";
import { postProductionSchema } from "@storyline/shared";
import * as projects from "../repositories/projects.js";
import { notFound } from "../errors.js";
import { parse } from "../validate.js";

export const postProductionRouter = Router();

postProductionRouter.get("/projects/:projectId/post-production", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  res.json(project.postProduction);
});

postProductionRouter.put("/projects/:projectId/post-production", (req, res) => {
  const settings = parse(postProductionSchema, req.body);
  const project = projects.updateProject(req.params.projectId, { postProduction: settings });
  if (!project) throw notFound("Project");
  projects.advanceStage(project.id, "first-cut");
  res.json(project.postProduction);
});
