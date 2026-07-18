import { describe, expect, it } from "vitest";
import { clamp, formatBytes, formatDuration, formatDurationLong, pluralize } from "./format.js";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("formats hours", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("handles missing values", () => {
    expect(formatDuration(undefined)).toBe("–:––");
  });
});

describe("formatDurationLong", () => {
  it("reads naturally", () => {
    expect(formatDurationLong(204)).toBe("3 min 24 sec");
    expect(formatDurationLong(180)).toBe("3 min");
    expect(formatDurationLong(42)).toBe("42 sec");
  });
});

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(360_000_000)).toBe("343 MB");
  });
});

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("pluralize", () => {
  it("handles singular and plural", () => {
    expect(pluralize(1, "video")).toBe("1 video");
    expect(pluralize(4, "video")).toBe("4 videos");
  });
});
