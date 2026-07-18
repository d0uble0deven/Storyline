import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import type {
  Highlight,
  Job,
  ProductionPlan,
  ProjectSummary,
  Revision,
  Story,
} from "@storyline/shared";

process.env.STORYLINE_DB_PATH = ":memory:";

const { createApp } = await import("../app.js");
const { tickJobs } = await import("../services/jobs.js");
const { resetDbForTests } = await import("../db/db.js");

const app = createApp();

function completeRunningJobs(): void {
  // Each tick advances 50 points; two ticks finish any job deterministically.
  tickJobs(50);
  tickJobs(50);
  tickJobs(50);
}

describe("the complete Storyline happy path", () => {
  let projectId = "";
  let highlights: Highlight[] = [];

  afterAll(() => resetDbForTests());

  it("creates a progression project with template defaults", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Test Ride", storyType: "progression", useTemplate: true })
      .expect(201);
    const project = res.body as ProjectSummary;
    projectId = project.id;
    expect(project.currentStage).toBe("media");
    expect(project.creativeBrief?.structure).toBe("Chronological");
  });

  it("rejects invalid project payloads", async () => {
    const res = await request(app).post("/api/projects").send({ name: "", storyType: "nope" }).expect(400);
    expect(res.body.error).toBeTruthy();
  });

  it("uploads a video with browser-probed metadata", async () => {
    await request(app)
      .post(`/api/projects/${projectId}/media`)
      .field("durationSeconds", "94")
      .field("recordedAt", "2025-08-02T09:00:00.000Z")
      .attach("file", Buffer.from("fake-video-bytes"), { filename: "first_practice.mp4", contentType: "video/mp4" })
      .expect(201);
    await request(app)
      .post(`/api/projects/${projectId}/media`)
      .field("durationSeconds", "120")
      .field("recordedAt", "2026-06-01T09:00:00.000Z")
      .attach("file", Buffer.from("fake-video-bytes-2"), { filename: "final_ride.mp4", contentType: "video/mp4" })
      .expect(201);
    const res = await request(app).get(`/api/projects/${projectId}/media`).expect(200);
    expect(res.body).toHaveLength(2);
  });

  it("rejects unsupported file types", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/media`)
      .attach("file", Buffer.from("not a video"), { filename: "notes.txt", contentType: "text/plain" })
      .expect(415);
    expect(res.body.error).toMatch(/isn't supported/);
  });

  it("saves the creative brief and advances the stage", async () => {
    await request(app)
      .put(`/api/projects/${projectId}/brief`)
      .send({ overview: "A year learning to ride a bike as an adult.", tones: ["Uplifting"], targetDurationSeconds: 240 })
      .expect(200);
    const res = await request(app).get(`/api/projects/${projectId}`).expect(200);
    expect((res.body as ProjectSummary).currentStage).toBe("brief");
  });

  it("generates a production plan from the brief", async () => {
    const res = await request(app).post(`/api/projects/${projectId}/production-plan/generate`).send({}).expect(200);
    const plan = res.body as ProductionPlan;
    expect(plan.projectGoal.value).toMatch(/year/i);
    expect(plan.storyInstructions.isLocked).toBe(false);
  });

  it("preserves locked sections and user edits through regeneration", async () => {
    await request(app)
      .patch(`/api/projects/${projectId}/production-plan`)
      .send({ sections: [{ key: "musicInstructions", value: "Only vinyl crackle, please.", isLocked: true }] })
      .expect(200);
    const res = await request(app).post(`/api/projects/${projectId}/production-plan/generate`).send({}).expect(200);
    const plan = res.body as ProductionPlan;
    expect(plan.musicInstructions.value).toBe("Only vinyl crackle, please.");
    expect(plan.musicInstructions.isLocked).toBe(true);
    expect(plan.musicInstructions.isUserEdited).toBe(true);
  });

  it("runs analysis as a resumable job that produces highlights", async () => {
    const start = await request(app).post(`/api/projects/${projectId}/analysis/start`).expect(202);
    expect((start.body as Job).status).toBe("running");
    completeRunningJobs();
    const status = await request(app).get(`/api/projects/${projectId}/analysis/status`).expect(200);
    expect((status.body as Job).status).toBe("complete");
    const res = await request(app).get(`/api/projects/${projectId}/highlights`).expect(200);
    highlights = res.body as Highlight[];
    expect(highlights.length).toBeGreaterThan(0);
    const project = (await request(app).get(`/api/projects/${projectId}`)).body as ProjectSummary;
    expect(project.currentStage).toBe("highlights");
  });

  it("supports review actions, trims, and bulk updates", async () => {
    const [first, ...rest] = highlights;
    await request(app)
      .patch(`/api/highlights/${first.id}`)
      .send({ status: "approved", priority: "essential", startSeconds: 2, endSeconds: 9, userNote: "Keeper." })
      .expect(200);
    if (rest.length > 0) {
      await request(app)
        .post("/api/highlights/bulk-update")
        .send({ ids: rest.map((h) => h.id), patch: { status: "approved" } })
        .expect(200);
    }
    const restored = await request(app).patch(`/api/highlights/${first.id}`).send({ restoreAiTrim: true }).expect(200);
    expect((restored.body as Highlight).startSeconds).toBe(first.aiStartSeconds);
  });

  it("refuses to build a story with no approved highlights", async () => {
    const empty = await request(app).post("/api/projects").send({ name: "Empty", storyType: "custom" }).expect(201);
    const res = await request(app).post(`/api/projects/${empty.body.id}/story/generate`).send({}).expect(400);
    expect(res.body.error).toMatch(/approve/i);
  });

  it("generates a story with chapters and title cards", async () => {
    const res = await request(app).post(`/api/projects/${projectId}/story/generate`).send({}).expect(200);
    const story = res.body as Story;
    expect(story.chapters.length).toBeGreaterThan(0);
    const items = story.chapters.flatMap((c) => c.items);
    expect(items.some((i) => i.type === "title-card")).toBe(true);
  });

  it("supports manual edits with undo and redo", async () => {
    const story = (await request(app).get(`/api/projects/${projectId}/story`)).body as Story;
    const edited = story.chapters.map((c, i) => (i === 0 ? { ...c, title: "A New Beginning" } : c));
    await request(app).patch(`/api/projects/${projectId}/story`).send({ chapters: edited }).expect(200);

    const undone = (await request(app).post(`/api/projects/${projectId}/story/undo`).expect(200)).body as Story;
    expect(undone.chapters[0].title).toBe(story.chapters[0].title);
    expect(undone.canRedo).toBe(true);

    const redone = (await request(app).post(`/api/projects/${projectId}/story/redo`).expect(200)).body as Story;
    expect(redone.chapters[0].title).toBe("A New Beginning");
  });

  it("proposes and applies a natural-language revision", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/revisions`)
      .send({ prompt: "Make the ending stronger" })
      .expect(201);
    const revision = res.body as Revision;
    expect(revision.status).toBe("proposed");
    expect(revision.summary.length).toBeGreaterThan(0);
    expect(revision.changes.length).toBeGreaterThan(0);

    await request(app).patch(`/api/revisions/${revision.id}`).send({ status: "applied" }).expect(200);
    const story = (await request(app).get(`/api/projects/${projectId}/story`)).body as Story;
    expect(story.canUndo).toBe(true);
  });

  it("handles unrecognized revision prompts gracefully", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/revisions`)
      .send({ prompt: "Give it more of a Tuesday afternoon feeling" })
      .expect(201);
    const revision = res.body as Revision;
    expect(revision.changes.length).toBeGreaterThan(0);
    await request(app).patch(`/api/revisions/${revision.id}`).send({ status: "rejected" }).expect(200);
  });

  it("persists post-production settings", async () => {
    const current = (await request(app).get(`/api/projects/${projectId}/post-production`)).body;
    current.music.trackId = "forward-motion";
    current.titles.openingTitle = "Learning to Ride";
    await request(app).put(`/api/projects/${projectId}/post-production`).send(current).expect(200);
    const saved = (await request(app).get(`/api/projects/${projectId}/post-production`)).body;
    expect(saved.music.trackId).toBe("forward-motion");
    expect(saved.titles.openingTitle).toBe("Learning to Ride");
  });

  it("exports through a render job to a downloadable result", async () => {
    const start = await request(app)
      .post(`/api/projects/${projectId}/export`)
      .send({ aspect: "16:9", resolution: "1080p", format: "mp4" })
      .expect(202);
    completeRunningJobs();
    const status = await request(app)
      .get(`/api/projects/${projectId}/export/${(start.body as Job).id}/status`)
      .expect(200);
    const job = status.body as Job;
    expect(job.status).toBe("complete");
    expect(job.result?.width).toBe(1920);
    await request(app).get(job.result!.downloadUrl).expect(200);

    const project = (await request(app).get(`/api/projects/${projectId}`)).body as ProjectSummary;
    expect(project.currentStage).toBe("finish");
    expect(project.status).toBe("complete");
  });

  it("serves the structured render plan", async () => {
    const res = await request(app).get(`/api/projects/${projectId}/render-plan`).expect(200);
    expect(res.body.format).toBe("mp4");
    expect(res.body.clips.length).toBeGreaterThan(0);
  });

  it("returns friendly 404s for missing projects", async () => {
    const res = await request(app).get("/api/projects/does-not-exist").expect(404);
    expect(res.body.error).toBe("Project not found");
  });
});
