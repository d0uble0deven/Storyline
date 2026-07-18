import { Router } from "express";
import { revisionCreateSchema, revisionPatchSchema, storyPatchSchema } from "@storyline/shared";
import { z } from "zod";
import * as projects from "../repositories/projects.js";
import * as stories from "../repositories/stories.js";
import * as revisions from "../repositories/revisions.js";
import { listHighlights } from "../repositories/highlights.js";
import { getRevisionAssistant, getStoryEditor } from "../services/ai/index.js";
import { AppError, notFound } from "../errors.js";
import { parse } from "../validate.js";

export const storyRouter = Router();

const generateSchema = z.object({ chapterId: z.string().optional() });

storyRouter.post("/projects/:projectId/story/generate", (req, res) => {
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  const highlights = listHighlights(project.id);
  const approved = highlights.filter((h) => h.status === "approved");
  if (approved.length === 0) {
    throw new AppError(400, "Approve some highlights first — the story is built from them.");
  }
  const { chapterId } = parse(generateSchema, req.body ?? {});
  const editor = getStoryEditor();
  const existing = stories.getStory(project.id);

  const chapters =
    chapterId && existing
      ? editor.regenerateChapter(project, highlights, existing.chapters, chapterId)
      : editor.generateStory(project, highlights);

  const story = stories.saveStory(project.id, chapters);
  projects.advanceStage(project.id, "story");
  res.json(story);
});

storyRouter.get("/projects/:projectId/story", (req, res) => {
  if (!projects.getProject(req.params.projectId)) throw notFound("Project");
  res.json(stories.getStory(req.params.projectId));
});

storyRouter.patch("/projects/:projectId/story", (req, res) => {
  const { chapters, transient } = parse(storyPatchSchema, req.body);
  if (!projects.getProject(req.params.projectId)) throw notFound("Project");
  if (!stories.getStory(req.params.projectId)) throw new AppError(400, "Generate a story first.");
  res.json(stories.saveStory(req.params.projectId, chapters, { transient }));
});

storyRouter.post("/projects/:projectId/story/undo", (req, res) => {
  const story = stories.undoStory(req.params.projectId);
  if (!story) throw notFound("Story");
  res.json(story);
});

storyRouter.post("/projects/:projectId/story/redo", (req, res) => {
  const story = stories.redoStory(req.params.projectId);
  if (!story) throw notFound("Story");
  res.json(story);
});

/* ---- Revisions ---- */

storyRouter.get("/projects/:projectId/revisions", (req, res) => {
  if (!projects.getProject(req.params.projectId)) throw notFound("Project");
  res.json(revisions.listRevisions(req.params.projectId));
});

storyRouter.post("/projects/:projectId/revisions", (req, res) => {
  const { prompt } = parse(revisionCreateSchema, req.body);
  const project = projects.getProject(req.params.projectId);
  if (!project) throw notFound("Project");
  const story = stories.getStory(project.id);
  if (!story) throw new AppError(400, "Generate a story before asking for revisions.");
  const highlights = listHighlights(project.id);
  const proposal = getRevisionAssistant().propose(project, story.chapters, highlights, prompt);
  const revision = revisions.createRevision({
    projectId: project.id,
    prompt,
    summary: proposal.summary,
    changes: proposal.changes,
    proposedChapters: proposal.proposedChapters,
  });
  res.status(201).json(revision);
});

storyRouter.patch("/revisions/:revisionId", (req, res) => {
  const { status } = parse(revisionPatchSchema, req.body);
  const revision = revisions.getRevision(req.params.revisionId);
  if (!revision) throw notFound("Revision");
  if (revision.status !== "proposed") {
    throw new AppError(409, "This revision has already been resolved.");
  }
  if (status === "applied" && revision.proposedChapters) {
    stories.saveStory(revision.projectId, revision.proposedChapters);
  }
  res.json(revisions.setRevisionStatus(revision.id, status));
});
