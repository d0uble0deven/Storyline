import { Router } from "express";
import { bulkHighlightSchema, highlightPatchSchema } from "@storyline/shared";
import * as highlights from "../repositories/highlights.js";
import { getProject } from "../repositories/projects.js";
import { notFound } from "../errors.js";
import { parse } from "../validate.js";

export const highlightsRouter = Router();

highlightsRouter.get("/projects/:projectId/highlights", (req, res) => {
  if (!getProject(req.params.projectId)) throw notFound("Project");
  res.json(highlights.listHighlights(req.params.projectId));
});

highlightsRouter.patch("/highlights/:highlightId", (req, res) => {
  const patch = parse(highlightPatchSchema, req.body);
  const updated = highlights.updateHighlight(req.params.highlightId, patch);
  if (!updated) throw notFound("Highlight");
  res.json(updated);
});

highlightsRouter.post("/highlights/bulk-update", (req, res) => {
  const { ids, patch } = parse(bulkHighlightSchema, req.body);
  const updated = ids
    .map((id) => highlights.updateHighlight(id, patch))
    .filter((h): h is NonNullable<typeof h> => h !== null);
  res.json(updated);
});
