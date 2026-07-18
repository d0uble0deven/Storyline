import { Router } from "express";
import type { ProductionPlan } from "@storyline/shared";
import { planGenerateSchema, planPatchSchema } from "@storyline/shared";
import * as projects from "../repositories/projects.js";
import { getProducer } from "../services/ai/index.js";
import { AppError, notFound } from "../errors.js";
import { parse } from "../validate.js";

export const planRouter = Router();

planRouter.get("/projects/:projectId/production-plan", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  res.json(project.productionPlan ?? null);
});

planRouter.post("/projects/:projectId/production-plan/generate", (req, res) => {
  const { section, mode } = parse(planGenerateSchema, req.body ?? {});
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  if (!project.creativeBrief || project.creativeBrief.overview.trim().length === 0) {
    throw new AppError(400, "Write your creative brief first — the production plan is built from it.");
  }
  const producer = getProducer();
  const brief = project.creativeBrief;

  let plan: ProductionPlan;
  if (!project.productionPlan) {
    plan = producer.generatePlan(project, brief);
  } else if (section) {
    plan = { ...project.productionPlan };
    if (plan[section].isLocked) {
      throw new AppError(409, "That section is locked. Unlock it to regenerate.");
    }
    const value = producer.regenerateSection(project, brief, plan, section);
    plan[section] = { value, originalAiValue: value, isLocked: false, isUserEdited: false };
  } else {
    // Regenerate everything that isn't locked; locked sections keep the user's instructions.
    const fresh = producer.generatePlan(project, brief);
    plan = { ...project.productionPlan };
    for (const key of Object.keys(fresh) as (keyof ProductionPlan)[]) {
      if (!plan[key] || (!plan[key].isLocked && mode !== "section")) {
        plan[key] = fresh[key];
      }
    }
  }

  const updated = projects.updateProject(project.id, { productionPlan: plan });
  projects.advanceStage(project.id, "plan");
  res.json(updated?.productionPlan ?? plan);
});

planRouter.patch("/projects/:projectId/production-plan", (req, res) => {
  const { sections } = parse(planPatchSchema, req.body);
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  if (!project.productionPlan) throw new AppError(400, "Generate the production plan first.");

  const plan = { ...project.productionPlan };
  for (const edit of sections) {
    const current = plan[edit.key];
    let value = current.value;
    if (edit.resetToAi) value = current.originalAiValue;
    else if (edit.value !== undefined) value = edit.value;
    plan[edit.key] = {
      ...current,
      value,
      isLocked: edit.isLocked ?? current.isLocked,
      isUserEdited: value !== current.originalAiValue,
    };
  }
  const updated = projects.updateProject(project.id, { productionPlan: plan });
  res.json(updated?.productionPlan ?? plan);
});
