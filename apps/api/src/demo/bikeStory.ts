import type { HighlightCategory, HighlightScores } from "@storyline/shared";

/**
 * The seeded demo dataset: one year of learning to ride a bike as an adult.
 * Media specs drive both the seed script and the mock curator, so analysis
 * results always line up with the media that actually exists.
 */

export type SceneSpec = {
  sky: [string, string];
  ground: string;
  path: string;
  sun?: { x: number; y: number; r: number; color: string };
  rain?: boolean;
  night?: boolean;
  trees?: number;
  indoor?: boolean;
};

export type BikeMediaSpec = {
  key: string;
  filename: string;
  label: string;
  recordedAt: string;
  durationSeconds: number;
  width: number;
  height: number;
  scene: SceneSpec;
};

const day: [string, string] = ["#cfe3ee", "#eef3ef"];
const golden: [string, string] = ["#f2cf9d", "#e9ddc8"];
const dusk: [string, string] = ["#d9a08c", "#c9b8c6"];
const overcast: [string, string] = ["#c8cdd1", "#dde0e0"];

export const bikeMedia: BikeMediaSpec[] = [
  { key: "first-practice", filename: "IMG_2025-08-02_first_practice.mp4", label: "First practice ride", recordedAt: "2025-08-02T09:12:00.000Z", durationSeconds: 94, width: 1920, height: 1080, scene: { sky: day, ground: "#b9b6ae", path: "#8f8c85", sun: { x: 520, y: 70, r: 28, color: "#f7e8b8" } } },
  { key: "balance-drills", filename: "IMG_2025-08-03_balance_drills.mp4", label: "Parking lot balance practice", recordedAt: "2025-08-03T10:05:00.000Z", durationSeconds: 128, width: 1920, height: 1080, scene: { sky: day, ground: "#b3b0a8", path: "#87847d" } },
  { key: "wobbly-start", filename: "IMG_2025-08-09_wobbly_start.mp4", label: "Wobbly start attempts", recordedAt: "2025-08-09T09:40:00.000Z", durationSeconds: 76, width: 1920, height: 1080, scene: { sky: overcast, ground: "#aeaba3", path: "#84817a" } },
  { key: "first-glide", filename: "IMG_2025-08-16_first_glide.mp4", label: "First real glide", recordedAt: "2025-08-16T17:30:00.000Z", durationSeconds: 65, width: 1920, height: 1080, scene: { sky: golden, ground: "#c2b294", path: "#96876b", sun: { x: 120, y: 90, r: 34, color: "#f4c977" } } },
  { key: "first-sustained-ride", filename: "IMG_2025-08-23_first_sustained_ride.mp4", label: "First sustained ride", recordedAt: "2025-08-23T09:55:00.000Z", durationSeconds: 112, width: 1920, height: 1080, scene: { sky: day, ground: "#a9c29a", path: "#8f8c85", sun: { x: 540, y: 60, r: 26, color: "#f7e8b8" }, trees: 2 } },
  { key: "neighborhood-loop", filename: "IMG_2025-09-06_neighborhood_loop.mp4", label: "Neighborhood loop", recordedAt: "2025-09-06T16:20:00.000Z", durationSeconds: 210, width: 1920, height: 1080, scene: { sky: day, ground: "#9fbb8f", path: "#8a877f", trees: 3 } },
  { key: "first-turn", filename: "IMG_2025-09-13_first_turn.mp4", label: "First successful turn", recordedAt: "2025-09-13T10:15:00.000Z", durationSeconds: 88, width: 1920, height: 1080, scene: { sky: day, ground: "#a6bf97", path: "#8f8c85", trees: 1 } },
  { key: "braking-practice", filename: "IMG_2025-09-20_braking_practice.mp4", label: "Braking practice", recordedAt: "2025-09-20T09:30:00.000Z", durationSeconds: 97, width: 1920, height: 1080, scene: { sky: overcast, ground: "#b0ad9f", path: "#807d76" } },
  { key: "helmet-cam-street", filename: "VID360_2025-10-04_street_ride.mp4", label: "Helmet-cam street ride", recordedAt: "2025-10-04T15:45:00.000Z", durationSeconds: 184, width: 3840, height: 1920, scene: { sky: day, ground: "#9aa79b", path: "#75726b", trees: 2 } },
  { key: "autumn-park-ride", filename: "IMG_2025-10-18_autumn_park.mp4", label: "Autumn park ride", recordedAt: "2025-10-18T16:10:00.000Z", durationSeconds: 246, width: 1920, height: 1080, scene: { sky: golden, ground: "#c9a06a", path: "#8f7a58", sun: { x: 160, y: 80, r: 30, color: "#f0b96a" }, trees: 4 } },
  { key: "first-trail", filename: "VID360_2025-11-01_first_trail.mp4", label: "First trail ride", recordedAt: "2025-11-01T14:05:00.000Z", durationSeconds: 232, width: 3840, height: 1920, scene: { sky: overcast, ground: "#8d9a76", path: "#6f6a55", trees: 5 } },
  { key: "rainy-ride", filename: "IMG_2025-11-15_rainy_ride.mp4", label: "Rainy ride", recordedAt: "2025-11-15T11:25:00.000Z", durationSeconds: 141, width: 1920, height: 1080, scene: { sky: ["#9aa4ad", "#b8bec2"], ground: "#8e948f", path: "#6d6a64", rain: true } },
  { key: "winter-tuneup", filename: "IMG_2026-01-10_garage_tuneup.mp4", label: "Winter garage tune-up", recordedAt: "2026-01-10T18:40:00.000Z", durationSeconds: 118, width: 1920, height: 1080, scene: { sky: ["#3d3a36", "#4a4642"], ground: "#5a554f", path: "#6b665f", indoor: true, night: true } },
  { key: "spring-return", filename: "IMG_2026-03-07_spring_return.mp4", label: "First spring ride", recordedAt: "2026-03-07T10:50:00.000Z", durationSeconds: 156, width: 1920, height: 1080, scene: { sky: day, ground: "#a3c793", path: "#8f8c85", sun: { x: 500, y: 65, r: 26, color: "#f7e8b8" }, trees: 2 } },
  { key: "hill-climb", filename: "IMG_2026-03-21_hill_climb.mp4", label: "Hill climb attempt", recordedAt: "2026-03-21T09:20:00.000Z", durationSeconds: 174, width: 1920, height: 1080, scene: { sky: day, ground: "#95b284", path: "#7d7a72", trees: 2 } },
  { key: "sunset-ride", filename: "VID360_2026-04-11_sunset_river.mp4", label: "Sunset ride by the river", recordedAt: "2026-04-11T19:35:00.000Z", durationSeconds: 198, width: 3840, height: 1920, scene: { sky: dusk, ground: "#7d6f77", path: "#5f5760", sun: { x: 320, y: 100, r: 40, color: "#f1a45f" } } },
  { key: "long-ride", filename: "IMG_2026-04-25_20k_ride.mp4", label: "Twenty-kilometer ride", recordedAt: "2026-04-25T08:30:00.000Z", durationSeconds: 264, width: 1920, height: 1080, scene: { sky: day, ground: "#9fbb8f", path: "#87847d", sun: { x: 560, y: 55, r: 24, color: "#f7e8b8" }, trees: 3 } },
  { key: "smooth-cornering", filename: "IMG_2026-05-16_smooth_corners.mp4", label: "Smooth cornering", recordedAt: "2026-05-16T17:05:00.000Z", durationSeconds: 132, width: 1920, height: 1080, scene: { sky: golden, ground: "#b7c39a", path: "#8a8778", sun: { x: 140, y: 85, r: 30, color: "#f4c977" }, trees: 1 } },
  { key: "group-ride", filename: "IMG_2026-06-06_group_ride.mp4", label: "First group ride", recordedAt: "2026-06-06T10:00:00.000Z", durationSeconds: 221, width: 1920, height: 1080, scene: { sky: day, ground: "#9cc290", path: "#8f8c85", trees: 3 } },
  { key: "final-ride", filename: "IMG_2026-06-27_final_ride.mp4", label: "Final confident ride", recordedAt: "2026-06-27T18:50:00.000Z", durationSeconds: 189, width: 1920, height: 1080, scene: { sky: golden, ground: "#aec69b", path: "#8a8778", sun: { x: 110, y: 75, r: 36, color: "#f2b567" }, trees: 2 } },
];

export type BikeHighlightTemplate = {
  mediaKey: string;
  title: string;
  category: HighlightCategory;
  start: number;
  end: number;
  scores: HighlightScores;
  reasoning: string;
  description: string;
  seedStatus: "approved" | "rejected" | "suggested";
  seedPriority: "essential" | "normal" | "optional";
  seedFavorite?: boolean;
  seedNote?: string;
};

const s = (
  visualQuality: number,
  storyRelevance: number,
  emotionalValue: number,
  progressionValue: number,
  uniqueness: number
): HighlightScores => ({ visualQuality, storyRelevance, emotionalValue, progressionValue, uniqueness });

export const bikeHighlights: BikeHighlightTemplate[] = [
  { mediaKey: "first-practice", title: "First nervous attempt", category: "beginning", start: 12, end: 26, scores: s(5, 10, 8, 10, 9), description: "The very first attempt to ride: both feet hovering, short push-offs, an immediate stop.", reasoning: "This clearly shows initial balance difficulty and is the natural starting point of the progression story. The footage is shaky, but it was kept because it strongly supports the narrative.", seedStatus: "approved", seedPriority: "essential", seedFavorite: true },
  { mediaKey: "first-practice", title: "Helmet on, deep breath", category: "funny", start: 2, end: 10, scores: s(6, 6, 7, 4, 6), description: "Adjusting the helmet three times, then a visible deep breath before the first try.", reasoning: "A small human moment that sets the tone with light humor before the journey begins.", seedStatus: "approved", seedPriority: "optional" },
  { mediaKey: "balance-drills", title: "Balance practice, foot down every few seconds", category: "learning", start: 30, end: 52, scores: s(6, 8, 5, 8, 6), description: "Repeated glide-and-catch drills across the parking lot.", reasoning: "Shows the unglamorous work of learning. Useful contrast for later confident riding.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "balance-drills", title: "Another drill pass", category: "learning", start: 70, end: 95, scores: s(5, 4, 3, 4, 2), description: "A further drill pass, visually similar to the earlier one.", reasoning: "Detected as visually similar to the earlier drill clip; the earlier one covers this beat.", seedStatus: "rejected", seedPriority: "optional" },
  { mediaKey: "wobbly-start", title: "The wobbliest start of the year", category: "funny", start: 8, end: 22, scores: s(5, 7, 8, 7, 8), description: "A start that swerves left, right, then left again before a laughing dismount.", reasoning: "Genuinely funny and honest about the difficulty — humor with narrative value.", seedStatus: "approved", seedPriority: "normal", seedFavorite: true },
  { mediaKey: "first-glide", title: "First real glide", category: "milestone", start: 20, end: 38, scores: s(7, 9, 8, 9, 8), description: "Feet off the ground for a full glide across the lot in golden light.", reasoning: "A possible first breakthrough moment — the first sustained glide without a catch.", seedStatus: "approved", seedPriority: "essential" },
  { mediaKey: "first-sustained-ride", title: "First sustained ride", category: "milestone", start: 40, end: 54, scores: s(6, 10, 8, 10, 9), description: "The rider remains balanced for approximately 14 seconds without placing a foot down.", reasoning: "This appears to be an important early milestone — the first genuinely sustained ride of the year.", seedStatus: "approved", seedPriority: "essential", seedFavorite: true, seedNote: "This was my first ride without putting my foot down." },
  { mediaKey: "first-sustained-ride", title: "The celebration afterward", category: "celebration", start: 60, end: 71, scores: s(6, 7, 9, 6, 7), description: "Fists in the air, a laugh, and a look back at the distance covered.", reasoning: "Emotional payoff directly attached to the first sustained ride.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "neighborhood-loop", title: "First full neighborhood loop", category: "progress", start: 95, end: 120, scores: s(7, 8, 6, 8, 7), description: "A complete loop of the block, including a controlled stop at the corner.", reasoning: "Marks the move from parking lot practice to real streets.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "neighborhood-loop", title: "Passing the mailbox gauntlet", category: "funny", start: 30, end: 41, scores: s(6, 5, 6, 4, 6), description: "A very wide, very cautious berth around a row of mailboxes.", reasoning: "Light moment that shows early caution; optional texture for the middle of the story.", seedStatus: "suggested", seedPriority: "optional" },
  { mediaKey: "first-turn", title: "First successful turn", category: "milestone", start: 34, end: 50, scores: s(7, 9, 7, 9, 8), description: "A full left turn taken smoothly, without stopping or wobbling.", reasoning: "Found a possible first successful turn — a key skill milestone in the progression.", seedStatus: "approved", seedPriority: "essential" },
  { mediaKey: "braking-practice", title: "Confident controlled stop", category: "learning", start: 55, end: 66, scores: s(6, 6, 4, 7, 5), description: "A smooth, deliberate stop exactly at the marked line.", reasoning: "Shows growing control; a quieter beat between bigger milestones.", seedStatus: "approved", seedPriority: "optional" },
  { mediaKey: "braking-practice", title: "Near-miss with a cone", category: "funny", start: 20, end: 30, scores: s(5, 5, 6, 4, 6), description: "A practice cone survives by inches; the rider does not stop laughing.", reasoning: "Funny, but overlaps with other humor beats already selected.", seedStatus: "suggested", seedPriority: "optional" },
  { mediaKey: "helmet-cam-street", title: "First street ride from the saddle", category: "progress", start: 60, end: 84, scores: s(8, 8, 6, 8, 8), description: "Helmet-camera view of the first real street ride, traffic humming past.", reasoning: "The point-of-view footage puts the viewer inside the progression — strong immersive value.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "helmet-cam-street", title: "Shaky street crossing", category: "progress", start: 100, end: 112, scores: s(3, 5, 4, 5, 3), description: "A hesitant crossing with significant camera shake.", reasoning: "Too shaky to use alongside the smoother street footage from the same ride.", seedStatus: "rejected", seedPriority: "optional" },
  { mediaKey: "autumn-park-ride", title: "Autumn colors over the handlebars", category: "scenic", start: 120, end: 140, scores: s(9, 7, 7, 5, 8), description: "Riding beneath a canopy of orange and gold in the park.", reasoning: "The strongest scenic footage of the fall — gives the story room to breathe.", seedStatus: "approved", seedPriority: "normal", seedFavorite: true },
  { mediaKey: "autumn-park-ride", title: "Golden hour glide", category: "scenic", start: 200, end: 220, scores: s(8, 6, 6, 4, 4), description: "A slow glide into low golden light at the park's edge.", reasoning: "Beautiful, but visually similar to the canopy clip from the same ride.", seedStatus: "suggested", seedPriority: "optional" },
  { mediaKey: "first-trail", title: "First time off pavement", category: "challenge", start: 40, end: 62, scores: s(7, 9, 7, 9, 9), description: "Leaving the paved path for gravel and dirt for the first time.", reasoning: "A clear escalation of difficulty — new terrain marks the story's middle turning point.", seedStatus: "approved", seedPriority: "essential" },
  { mediaKey: "first-trail", title: "Roots and rattles", category: "challenge", start: 120, end: 134, scores: s(6, 6, 5, 6, 5), description: "A bumpy stretch of exposed roots taken slowly but successfully.", reasoning: "Reinforces the trail challenge; optional if the section runs long.", seedStatus: "suggested", seedPriority: "optional" },
  { mediaKey: "rainy-ride", title: "Riding through the rain", category: "challenge", start: 48, end: 70, scores: s(5, 8, 8, 8, 9), description: "Committed riding through steady rain, grinning under the hood.", reasoning: "Preserved despite imperfect footage: riding in bad weather shows real commitment to the year.", seedStatus: "approved", seedPriority: "normal", seedFavorite: true },
  { mediaKey: "winter-tuneup", title: "Garage tune-up dance", category: "funny", start: 66, end: 80, scores: s(6, 5, 7, 3, 7), description: "A victory dance after finally getting the chain back on.", reasoning: "A warm off-season beat that keeps the story human through the winter gap.", seedStatus: "approved", seedPriority: "optional" },
  { mediaKey: "spring-return", title: "Back on the bike after winter", category: "progress", start: 22, end: 44, scores: s(7, 8, 7, 8, 7), description: "The first spring ride — noticeably steadier than anything from the fall.", reasoning: "The contrast with early footage is striking here; winter did not undo the progress.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "hill-climb", title: "The hill that almost won", category: "challenge", start: 90, end: 116, scores: s(6, 8, 8, 8, 8), description: "Standing on the pedals, weaving up the steepest section of the hill.", reasoning: "Visible effort and a real chance of failure — the strongest tension beat of the spring.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "hill-climb", title: "Cresting the top", category: "celebration", start: 130, end: 142, scores: s(7, 7, 9, 7, 7), description: "Reaching the top of the hill with a shout and a wide grin.", reasoning: "Direct emotional payoff for the climb — these two clips work as a pair.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "sunset-ride", title: "Sunset along the river path", category: "scenic", start: 84, end: 108, scores: s(9, 7, 8, 5, 8), description: "Silhouetted riding along the river as the sun goes down.", reasoning: "The most cinematic footage in the library — ideal for the story's later, calmer stretch.", seedStatus: "approved", seedPriority: "normal", seedFavorite: true },
  { mediaKey: "long-ride", title: "Twenty kilometers, no stops", category: "milestone", start: 200, end: 226, scores: s(7, 9, 7, 9, 8), description: "The final stretch of the first twenty-kilometer ride, cadence steady.", reasoning: "A distance milestone that quantifies the year's progress.", seedStatus: "approved", seedPriority: "essential" },
  { mediaKey: "smooth-cornering", title: "Cornering like it's nothing", category: "progress", start: 45, end: 63, scores: s(8, 8, 6, 9, 7), description: "A chain of corners taken fluidly at speed — compare with the first turn in September.", reasoning: "Placed against the first-turn clip, this shows the clearest before-and-after of the year.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "group-ride", title: "First group ride", category: "celebration", start: 140, end: 162, scores: s(7, 7, 8, 7, 8), description: "Riding in formation with friends, holding a steady line in the group.", reasoning: "Riding with others is its own milestone — confidence made social.", seedStatus: "approved", seedPriority: "normal" },
  { mediaKey: "final-ride", title: "The strongest ride of the year", category: "strong-finish", start: 120, end: 150, scores: s(9, 10, 9, 10, 9), description: "Fast, smooth, assured riding in golden evening light — the best footage of the year.", reasoning: "The clear ending: every quality is at its peak, and the light does half the storytelling.", seedStatus: "approved", seedPriority: "essential", seedFavorite: true },
  { mediaKey: "final-ride", title: "Riding away, steady and sure", category: "strong-finish", start: 160, end: 178, scores: s(8, 9, 9, 9, 8), description: "The rider heads away from the camera down a long, open path.", reasoning: "A natural closing image — the rider literally riding off into the year ahead.", seedStatus: "approved", seedPriority: "essential" },
];

export const bikeAnalysisFindings = [
  "Found an early clip that clearly shows initial balance difficulty.",
  "Detected three visually similar parking-lot drill sequences — keeping the strongest.",
  "Found a possible first sustained ride: roughly 14 seconds without a foot down.",
  "Found a possible first successful turn.",
  "Detected two visually similar autumn park sequences.",
  "Preserved a shaky rain clip because it strongly supports the progression story.",
  "The June footage is measurably smoother and faster than August — strong ending material.",
];

export const genericAnalysisFindings = [
  "Grouped your clips by time and location.",
  "Detected several visually similar sequences — keeping the strongest of each.",
  "Found clips with strong emotional moments worth reviewing.",
  "Matched candidate moments against your creative brief.",
];

export const bikeBriefOverview =
  "Create a four-minute video about my first year learning to ride a bike as an adult. I want it to feel personal, uplifting, and a little cinematic without being overly dramatic. Show the progression from nervous beginner to confident rider. Include early awkward moments, milestones, scenic rides, funny moments, and my smoothest riding near the end. Use upbeat instrumental music, mostly clean cuts, a few subtle transitions, and simple titles with dates or milestones. End with a strong final ride and a short message celebrating the year.";
