import type { CreativeProducer, HighlightCurator, RevisionAssistant, StoryEditor } from "./types.js";
import { mockProducer } from "./mockProducer.js";
import { mockCurator } from "./mockCurator.js";
import { mockStoryEditor } from "./mockStoryEditor.js";
import { mockRevisionAssistant } from "./mockRevisionAssistant.js";

/**
 * Service factory. The MVP always returns mocks; real implementations
 * (Gemini video understanding, multimodal models, etc.) plug in here.
 */
export function getProducer(): CreativeProducer {
  return mockProducer;
}

export function getCurator(): HighlightCurator {
  return mockCurator;
}

export function getStoryEditor(): StoryEditor {
  return mockStoryEditor;
}

export function getRevisionAssistant(): RevisionAssistant {
  return mockRevisionAssistant;
}

export type { RevisionProposal } from "./types.js";
