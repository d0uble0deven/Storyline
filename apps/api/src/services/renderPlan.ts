import type { ExportConfig, Highlight, Project, RenderClip, RenderPlan, Story } from "@storyline/shared";

/**
 * Builds the structured render plan from the story and post-production
 * settings. The MVP stores and displays this; a future deterministic media
 * engine (FFmpeg, cloud workers, or a Remotion composition) executes it.
 */
export function buildRenderPlan(
  project: Project,
  story: Story,
  highlights: Highlight[],
  config: ExportConfig = { aspect: "16:9", resolution: "1080p", format: "mp4" }
): RenderPlan {
  const byId = new Map(highlights.map((h) => [h.id, h]));
  const clips: RenderClip[] = [];
  let cursor = 0;
  for (const chapter of story.chapters) {
    for (const item of chapter.items) {
      const highlight = item.highlightId ? byId.get(item.highlightId) : undefined;
      clips.push({
        storyItemId: item.id,
        mediaItemId: highlight?.mediaItemId,
        sourceStartSeconds: highlight?.startSeconds ?? 0,
        sourceEndSeconds: highlight ? Math.min(highlight.endSeconds, highlight.startSeconds + item.durationSeconds) : item.durationSeconds,
        timelineStartSeconds: Math.round(cursor * 10) / 10,
        transitionIn: item.transitionIn,
        speed: 1,
        audioGain: project.postProduction.music.preserveNaturalAudio ? 0.7 : 0,
      });
      cursor += item.durationSeconds;
    }
  }
  const long = config.resolution === "720p" ? 1280 : config.resolution === "1080p" ? 1920 : 3840;
  const short = config.resolution === "720p" ? 720 : config.resolution === "1080p" ? 1080 : 2160;
  const [width, height] =
    config.aspect === "16:9" ? [long, short] : config.aspect === "9:16" ? [short, long] : [short, short];
  return {
    width,
    height,
    frameRate: 30,
    format: "mp4",
    totalDurationSeconds: Math.round(cursor),
    clips,
    music: project.postProduction.music,
    titles: project.postProduction.titles,
    watermark: project.postProduction.watermark.mode === "none" ? undefined : project.postProduction.watermark,
  };
}
