import type {
  CreativeBrief,
  PlanSection,
  PlanSectionKey,
  ProductionPlan,
  Project,
} from "@storyline/shared";
import type { CreativeProducer } from "./types.js";

function minutesLabel(seconds?: number): string {
  if (!seconds) return "three to four minutes";
  if (seconds <= 75) return "about one minute";
  if (seconds <= 180) return "two to three minutes";
  if (seconds <= 330) return "about four minutes";
  return "eight to ten minutes";
}

function isBikeStory(brief: CreativeBrief): boolean {
  return /\b(bike|biking|riding|ride|cycling)\b/i.test(brief.overview);
}

function toneSentence(brief: CreativeBrief): string {
  if (brief.tones.length === 0) return "Keep the tone natural and warm.";
  const tones = brief.tones.map((t) => t.toLowerCase());
  return `Keep the overall tone ${tones.join(", ")}, without tipping into melodrama.`;
}

type SectionBuilder = (project: Project, brief: CreativeBrief, variant: number) => string;

const builders: Record<PlanSectionKey, SectionBuilder> = {
  projectGoal: (project, brief, v) => {
    if (isBikeStory(brief)) {
      return v % 2 === 0
        ? "Celebrate the first year of learning to ride a bike as an adult, and clearly show the progression from uncertainty to confidence. The finished video should feel personal and uplifting, ending on the strongest riding of the year."
        : "Tell the story of one year on the bike: from nervous first attempts to smooth, confident riding. Make the progression unmistakable and let the ending feel earned.";
    }
    return v % 2 === 0
      ? `Create a ${minutesLabel(brief.targetDurationSeconds)} video that tells the story described in the brief for "${project.name}", with a clear beginning, middle, and end that viewers can follow without any explanation.`
      : `Shape the footage from "${project.name}" into a ${minutesLabel(brief.targetDurationSeconds)} story with a strong opening, a middle that builds, and an ending worth waiting for.`;
  },
  highlightInstructions: (_project, brief, v) => {
    if (isBikeStory(brief)) {
      return v % 2 === 0
        ? "Identify clips that show early nervousness, awkward starts, balance improvements, successful turns, longer rides, new environments, scenic moments, humor, milestones, and confident riding later in the year. Retain imperfect footage when it has emotional or narrative value."
        : "Look for the arc: shaky first attempts, small wins, first milestones, harder challenges, scenic breathers, and the smoothest riding at the end. Keep flawed clips when they carry the story better than polished ones.";
    }
    return "Identify the moments that carry the story: firsts, milestones, emotional beats, scenic breathers, and humor. Prefer clips with clear action or feeling over technically perfect but empty footage, and keep imperfect clips when they have narrative value.";
  },
  storyInstructions: (_project, brief, v) => {
    if (isBikeStory(brief)) {
      return v % 2 === 0
        ? `Build a chronological ${minutesLabel(brief.targetDurationSeconds)} story. Begin with uncertainty and short early attempts. Gradually increase the energy and confidence. Alternate progression moments with scenery and humor. End with the strongest riding footage.`
        : `Tell the year in order across ${minutesLabel(brief.targetDurationSeconds)}: open small and uncertain, build skill by skill, breathe with scenic and funny beats, and close with the most confident riding of the year.`;
    }
    const structure = brief.structure ? brief.structure.toLowerCase() : "chronological";
    return `Build a ${structure} story of ${minutesLabel(brief.targetDurationSeconds)}. Open with a moment that sets the scene, develop the middle with variety in energy and pacing, and end on the strongest material. ${toneSentence(brief)}`;
  },
  musicInstructions: (_project, brief, v) => {
    const base =
      v % 2 === 0
        ? "Use uplifting instrumental music that begins gently and builds. Preserve meaningful natural audio and reduce the music beneath speech."
        : "Choose instrumental music that starts understated and grows with the story. Keep real-world sound where it matters and duck the music under any voices.";
    if (brief.tones.some((t) => /reflective|emotional/i.test(t))) {
      return base + " Let quieter passages carry the more emotional moments.";
    }
    return base;
  },
  visualInstructions: (_project, _brief, v) =>
    v % 2 === 0
      ? "Use a natural documentary style with light stabilization, consistent exposure, restrained color correction, and occasional slow motion on key moments."
      : "Keep the look honest: gentle stabilization, matched exposure across months of footage, restrained color, and slow motion reserved for one or two peak moments.",
  transitionInstructions: (_project, _brief, v) =>
    v % 2 === 0
      ? "Use mostly clean cuts. Use subtle dissolves between time periods or major locations. Avoid flashy transitions."
      : "Cut cleanly within scenes. Reserve soft dissolves for jumps in time or place. Nothing showy.",
  titleInstructions: (_project, brief, v) => {
    const opening = brief.title ? `Open with the title "${brief.title}".` : "Add a simple opening title.";
    return v % 2 === 0
      ? `${opening} Use occasional milestone cards and dates where helpful, and close with a short celebratory message.`
      : `${opening} Mark key milestones with brief cards, add dates only where they help, and end with a one-line closing message.`;
  },
  exportInstructions: (_project, brief) => {
    const length = minutesLabel(brief.targetDurationSeconds);
    return `16:9 landscape, 1080p, approximately ${length}, delivered as a downloadable MP4. Optionally create a vertical version for social sharing afterward.`;
  },
};

function section(value: string): PlanSection {
  return { value, originalAiValue: value, isLocked: false, isUserEdited: false };
}

export const mockProducer: CreativeProducer = {
  generatePlan(project, brief) {
    const plan = {} as ProductionPlan;
    for (const key of Object.keys(builders) as PlanSectionKey[]) {
      plan[key] = section(builders[key](project, brief, 0));
    }
    return plan;
  },
  regenerateSection(project, brief, plan, key) {
    // Deterministic variety: alternate phrasings based on the current value.
    const variant = plan[key].value === builders[key](project, brief, 0) ? 1 : 0;
    return builders[key](project, brief, variant);
  },
};
