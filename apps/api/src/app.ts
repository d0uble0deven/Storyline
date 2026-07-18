import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { UPLOADS_DIR } from "./db/db.js";
import { AppError } from "./errors.js";
import { projectsRouter } from "./routes/projects.js";
import { mediaRouter } from "./routes/media.js";
import { briefRouter } from "./routes/brief.js";
import { planRouter } from "./routes/plan.js";
import { analysisRouter } from "./routes/analysis.js";
import { highlightsRouter } from "./routes/highlights.js";
import { storyRouter } from "./routes/story.js";
import { postProductionRouter } from "./routes/postProduction.js";
import { exportsRouter } from "./routes/exports.js";

export function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.use("/uploads", express.static(UPLOADS_DIR, { fallthrough: false, maxAge: "1h" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", projectsRouter);
  app.use("/api", mediaRouter);
  app.use("/api", briefRouter);
  app.use("/api", planRouter);
  app.use("/api", analysisRouter);
  app.use("/api", highlightsRouter);
  app.use("/api", storyRouter);
  app.use("/api", postProductionRouter);
  app.use("/api", exportsRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "That file is larger than the 2 GB upload limit."
          : "The upload could not be processed.";
      res.status(413).json({ error: message });
      return;
    }
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ error: "The request body wasn't valid JSON." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our side. Please try again." });
  });

  return app;
}
