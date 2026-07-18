import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { ACCEPTED_VIDEO_TYPES, MAX_UPLOAD_BYTES, mediaPatchSchema } from "@storyline/shared";
import * as media from "../repositories/media.js";
import { advanceStage, getProject } from "../repositories/projects.js";
import { UPLOADS_DIR, newId } from "../db/db.js";
import { AppError, notFound } from "../errors.js";
import { parse } from "../validate.js";

export const mediaRouter = Router();

const upload = multer({
  dest: path.join(UPLOADS_DIR, "tmp"),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "file" && !ACCEPTED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(new AppError(415, "That file type isn't supported. Storyline accepts MP4, MOV, WebM, AVI, and MKV videos."));
      return;
    }
    if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
      cb(new AppError(415, "Thumbnails must be images."));
      return;
    }
    cb(null, true);
  },
});

const SAFE_EXT = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv"]);

mediaRouter.get("/projects/:projectId/media", (req, res) => {
  if (!getProject(req.params.projectId)) throw notFound("Project");
  res.json(media.listMedia(req.params.projectId));
});

mediaRouter.post(
  "/projects/:projectId/media",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res) => {
    const projectId = String(req.params.projectId);
    if (!getProject(projectId)) throw notFound("Project");
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.file?.[0];
    if (!file) throw new AppError(400, "No video file was uploaded.");

    const ext = path.extname(file.originalname).toLowerCase();
    if (!SAFE_EXT.has(ext)) {
      rmSync(file.path, { force: true });
      throw new AppError(415, "That file type isn't supported. Storyline accepts MP4, MOV, WebM, AVI, and MKV videos.");
    }

    const id = newId();
    const projectDir = path.join(UPLOADS_DIR, projectId);
    mkdirSync(projectDir, { recursive: true });
    const storedName = `${id}${ext}`;
    renameSync(file.path, path.join(projectDir, storedName));

    let thumbnailUrl: string | undefined;
    const thumb = files?.thumbnail?.[0];
    if (thumb) {
      const thumbName = `${id}.jpg`;
      renameSync(thumb.path, path.join(projectDir, thumbName));
      thumbnailUrl = `/uploads/${projectId}/${thumbName}`;
    }

    const body = req.body as Record<string, string | undefined>;
    const duration = body.durationSeconds ? Number(body.durationSeconds) : undefined;
    const item = media.createMedia({
      id,
      projectId,
      filename: storedName,
      originalFilename: path.basename(file.originalname),
      mimeType: file.mimetype,
      source: "upload",
      storagePath: path.join(projectId, storedName),
      previewUrl: `/uploads/${projectId}/${storedName}`,
      thumbnailUrl,
      durationSeconds: duration && Number.isFinite(duration) ? Math.round(duration * 10) / 10 : undefined,
      recordedAt: body.recordedAt || undefined,
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      status: "ready",
    });
    // Adding footage completes the Media stage — the brief is the natural next step.
    advanceStage(projectId, "brief");
    res.status(201).json(item);
  }
);

mediaRouter.patch("/media/:mediaId", (req, res) => {
  const patch = parse(mediaPatchSchema, req.body);
  const item = media.updateMedia(req.params.mediaId, patch);
  if (!item) throw notFound("Media item");
  res.json(item);
});

mediaRouter.delete("/media/:mediaId", (req, res) => {
  const item = media.getMedia(req.params.mediaId);
  if (!item) throw notFound("Media item");
  if (item.storagePath) {
    rmSync(path.join(UPLOADS_DIR, item.storagePath), { force: true });
    rmSync(path.join(UPLOADS_DIR, item.projectId, `${item.id}.jpg`), { force: true });
  }
  media.deleteMedia(item.id);
  res.status(204).end();
});
