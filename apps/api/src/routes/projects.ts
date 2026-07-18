import { Router } from "express";
import { rmSync } from "node:fs";
import path from "node:path";
import { createProjectSchema, updateProjectSchema } from "@storyline/shared";
import * as projects from "../repositories/projects.js";
import { UPLOADS_DIR } from "../db/db.js";
import { notFound } from "../errors.js";
import { parse } from "../validate.js";

export const projectsRouter = Router();

projectsRouter.get("/projects", (_req, res) => {
  res.json(projects.listProjects().map(projects.toSummary));
});

projectsRouter.post("/projects", (req, res) => {
  const input = parse(createProjectSchema, req.body);
  let project = projects.createProject(input);
  if (input.useTemplate && input.storyType === "progression") {
    // The progression template starts the brief with sensible defaults.
    project =
      projects.updateProject(project.id, {
        creativeBrief: {
          overview: "",
          targetDurationSeconds: 270,
          audience: "Friends and family",
          tones: ["Uplifting", "Cinematic"],
          structure: "Chronological",
        },
      }) ?? project;
  }
  res.status(201).json(projects.toSummary(project));
});

projectsRouter.get("/projects/:projectId", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  res.json(projects.toSummary(project));
});

projectsRouter.patch("/projects/:projectId", (req, res) => {
  const patch = parse(updateProjectSchema, req.body);
  const project = projects.updateProject(req.params.projectId, patch);
  if (!project) throw notFound("Project");
  res.json(projects.toSummary(project));
});

projectsRouter.delete("/projects/:projectId", (req, res) => {
  const existed = projects.deleteProject(req.params.projectId);
  if (!existed) throw notFound("Project");
  rmSync(path.join(UPLOADS_DIR, req.params.projectId), { recursive: true, force: true });
  res.status(204).end();
});
