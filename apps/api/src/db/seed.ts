import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDb, UPLOADS_DIR } from "./db.js";
import { svgScene, genericScene } from "./svg.js";
import { bikeBriefOverview, bikeMedia } from "../demo/bikeStory.js";
import * as projects from "../repositories/projects.js";
import { createMedia } from "../repositories/media.js";
import { createHighlight, listHighlights } from "../repositories/highlights.js";
import { saveStory } from "../repositories/stories.js";
import { getCurator, getProducer, getStoryEditor } from "../services/ai/index.js";
import { PLACEHOLDER_MP4 } from "../services/jobs.js";

function wipe(): void {
  const db = getDb();
  for (const table of ["jobs", "revisions", "stories", "highlights", "media_items", "projects"]) {
    db.exec(`DELETE FROM ${table}`);
  }
}

function writeSample(name: string, svg: string): string {
  const dir = path.join(UPLOADS_DIR, "sample");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), svg, "utf8");
  return `/uploads/sample/${name}`;
}

function makePlaceholderVideo(): void {
  if (existsSync(PLACEHOLDER_MP4)) return;
  mkdirSync(path.dirname(PLACEHOLDER_MP4), { recursive: true });
  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-f", "lavfi", "-i", "color=c=0x22201d:s=1280x720:d=4:r=24", "-pix_fmt", "yuv420p", PLACEHOLDER_MP4],
      { stdio: "ignore" }
    );
    console.log("Generated placeholder render with ffmpeg.");
  } catch {
    writeFileSync(
      PLACEHOLDER_MP4,
      "Storyline placeholder render. Real encoding arrives with the media engine."
    );
    console.log("ffmpeg not available — wrote a stub placeholder render.");
  }
}

function seedBikeProject(): void {
  let project = projects.createProject({
    name: "My First Year Riding",
    description:
      "A video celebrating my progression from learning to ride a bike as an adult to riding comfortably and confidently.",
    storyType: "progression",
  });

  // Media with generated poster art.
  for (const [i, spec] of bikeMedia.entries()) {
    const thumb = writeSample(`bike-${spec.key}.svg`, svgScene(spec.scene, i * 97 + 13));
    createMedia({
      projectId: project.id,
      filename: spec.filename,
      originalFilename: spec.filename,
      mimeType: "video/mp4",
      source: "sample",
      thumbnailUrl: thumb,
      durationSeconds: spec.durationSeconds,
      recordedAt: spec.recordedAt,
      uploadedAt: spec.recordedAt,
      width: spec.width,
      height: spec.height,
      status: "analyzed",
      notes: spec.key === "final-ride" ? "Best light of the whole year — shot at golden hour." : undefined,
      isImportant: spec.key === "first-sustained-ride" || spec.key === "final-ride",
    });
  }

  // Brief.
  const brief = {
    overview: bikeBriefOverview,
    targetDurationSeconds: 270,
    audience: "Friends and family",
    tones: ["Uplifting", "Cinematic", "Natural"],
    structure: "Chronological",
    ending: "One ride at a time.",
    title: "Learning to Ride",
  };
  project = projects.updateProject(project.id, { creativeBrief: brief }) ?? project;

  // Production plan from the mock producer.
  const plan = getProducer().generatePlan(project, brief);
  project = projects.updateProject(project.id, { productionPlan: plan }) ?? project;

  // Highlights via the mock curator, applying the demo's review states.
  for (const c of getCurator().analyzeProject(project.id)) {
    createHighlight({
      ...c,
      status: c.seedStatus ?? "suggested",
      priority: c.seedPriority ?? "normal",
      isFavorite: c.seedFavorite ?? false,
      userNote: c.seedNote,
    });
  }

  // First-cut story from the mock story editor.
  project = projects.getProject(project.id) ?? project;
  saveStory(project.id, getStoryEditor().generateStory(project, listHighlights(project.id)));

  // Post-production defaults tuned for this story.
  const post = project.postProduction;
  post.titles.openingTitle = "Learning to Ride";
  post.titles.openingSubtitle = "2026";
  post.titles.closingMessage = "One ride at a time.";
  post.titles.chapterCards = false;
  projects.updateProject(project.id, {
    postProduction: post,
    coverUrl: "/uploads/sample/bike-sunset-ride.svg",
    currentStage: "first-cut",
    status: "in-progress",
  });
}

function seedLightProject(opts: {
  name: string;
  description: string;
  storyType: "travel" | "family";
  stage: "media" | "brief";
  mediaLabels: { label: string; date: string; duration: number }[];
  brief?: string;
  coverIndex: number;
  updatedDaysAgo: number;
}): void {
  const project = projects.createProject({
    name: opts.name,
    description: opts.description,
    storyType: opts.storyType,
  });
  let cover = "";
  for (const [i, m] of opts.mediaLabels.entries()) {
    const slug = m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const thumb = writeSample(
      `${project.id.slice(0, 8)}-${slug}.svg`,
      svgScene(genericScene(i), i * 61 + 7, { rider: false })
    );
    if (i === opts.coverIndex) cover = thumb;
    createMedia({
      projectId: project.id,
      filename: `${slug}.mp4`,
      originalFilename: `${slug}.mp4`,
      mimeType: "video/mp4",
      source: "sample",
      thumbnailUrl: thumb,
      durationSeconds: m.duration,
      recordedAt: m.date,
      uploadedAt: m.date,
      width: 1920,
      height: 1080,
      status: "ready",
    });
  }
  projects.updateProject(project.id, {
    coverUrl: cover,
    currentStage: opts.stage,
    status: opts.stage === "media" ? "draft" : "in-progress",
    creativeBrief: opts.brief ? { overview: opts.brief, tones: [] } : undefined,
  });
  // Backdate "last edited" so the dashboard feels lived-in.
  const ts = new Date(Date.now() - opts.updatedDaysAgo * 86_400_000).toISOString();
  getDb().prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(ts, project.id);
}

export function runSeed(): void {
  getDb();
  wipe();
  makePlaceholderVideo();
  seedBikeProject();

  seedLightProject({
    name: "India 2026",
    description: "Three weeks across Delhi, Jaipur, and Kerala with the whole family.",
    storyType: "travel",
    stage: "media",
    coverIndex: 2,
    updatedDaysAgo: 3,
    mediaLabels: [
      { label: "Delhi arrival", date: "2026-02-03T08:20:00.000Z", duration: 142 },
      { label: "Old city market walk", date: "2026-02-05T15:10:00.000Z", duration: 208 },
      { label: "Jaipur rooftop sunset", date: "2026-02-09T18:45:00.000Z", duration: 96 },
      { label: "Amber fort morning", date: "2026-02-10T09:30:00.000Z", duration: 187 },
      { label: "Kerala backwaters", date: "2026-02-15T11:00:00.000Z", duration: 254 },
      { label: "Beach farewell dinner", date: "2026-02-19T19:20:00.000Z", duration: 121 },
    ],
  });

  seedLightProject({
    name: "Milo's First Year",
    description: "From tiny puppy to certified good boy.",
    storyType: "family",
    stage: "brief",
    coverIndex: 0,
    updatedDaysAgo: 10,
    brief:
      "A short film about Milo's first year with us — from the day we brought him home through his first swim, first snow, and graduating puppy school.",
    mediaLabels: [
      { label: "Coming home day", date: "2025-09-14T12:00:00.000Z", duration: 133 },
      { label: "First walk", date: "2025-09-20T10:15:00.000Z", duration: 87 },
      { label: "Puppy school graduation", date: "2026-01-24T14:30:00.000Z", duration: 164 },
      { label: "First snow zoomies", date: "2026-01-30T09:00:00.000Z", duration: 76 },
      { label: "Lake day first swim", date: "2026-06-13T13:40:00.000Z", duration: 191 },
    ],
  });

  console.log("Seeded Storyline demo data.");
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isDirectRun) {
  runSeed();
}
