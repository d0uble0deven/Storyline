import { describe, expect, it } from "vitest";
import {
  briefSchema,
  bulkHighlightSchema,
  createProjectSchema,
  exportRequestSchema,
  highlightPatchSchema,
  storyPatchSchema,
} from "./schemas.js";

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    const result = createProjectSchema.safeParse({ name: "My First Year Riding", storyType: "progression" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createProjectSchema.safeParse({ name: "   ", storyType: "progression" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown story type", () => {
    const result = createProjectSchema.safeParse({ name: "Trip", storyType: "vlog" });
    expect(result.success).toBe(false);
  });
});

describe("briefSchema", () => {
  it("defaults tones to an empty array", () => {
    const result = briefSchema.parse({ overview: "A story about a year of riding." });
    expect(result.tones).toEqual([]);
  });

  it("rejects absurd target durations", () => {
    expect(briefSchema.safeParse({ overview: "x", targetDurationSeconds: 5 }).success).toBe(false);
    expect(briefSchema.safeParse({ overview: "x", targetDurationSeconds: 999999 }).success).toBe(false);
  });
});

describe("highlightPatchSchema", () => {
  it("accepts review actions", () => {
    expect(highlightPatchSchema.safeParse({ status: "approved", priority: "essential" }).success).toBe(true);
  });

  it("rejects invalid status values", () => {
    expect(highlightPatchSchema.safeParse({ status: "maybe" }).success).toBe(false);
  });
});

describe("bulkHighlightSchema", () => {
  it("requires at least one id", () => {
    expect(bulkHighlightSchema.safeParse({ ids: [], patch: { status: "approved" } }).success).toBe(false);
  });
});

describe("storyPatchSchema", () => {
  it("validates a chapter structure", () => {
    const result = storyPatchSchema.safeParse({
      chapters: [
        {
          id: "c1",
          title: "Starting Out",
          order: 0,
          items: [
            { id: "i1", type: "highlight", highlightId: "h1", durationSeconds: 8, isLocked: false },
            { id: "i2", type: "title-card", title: "Learning to Ride", durationSeconds: 4, isLocked: false },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero-length clips", () => {
    const result = storyPatchSchema.safeParse({
      chapters: [
        { id: "c1", title: "X", order: 0, items: [{ id: "i", type: "highlight", durationSeconds: 0, isLocked: false }] },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("exportRequestSchema", () => {
  it("accepts a standard export", () => {
    expect(exportRequestSchema.safeParse({ aspect: "16:9", resolution: "1080p", format: "mp4" }).success).toBe(true);
  });

  it("rejects unsupported formats", () => {
    expect(exportRequestSchema.safeParse({ aspect: "16:9", resolution: "1080p", format: "avi" }).success).toBe(false);
  });
});
