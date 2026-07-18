import type { SceneSpec } from "../demo/bikeStory.js";

/**
 * Generates simple, art-directed SVG poster frames for the seeded demo media.
 * Flat editorial compositions — no copyrighted material, no photo assets.
 */
export function svgScene(spec: SceneSpec, seed = 0, opts: { rider?: boolean } = {}): string {
  const withRider = opts.rider ?? true;
  const w = 640;
  const h = 360;
  const horizon = spec.indoor ? 250 : 230;
  const parts: string[] = [];

  parts.push(
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${spec.sky[0]}"/><stop offset="1" stop-color="${spec.sky[1]}"/>` +
      `</linearGradient></defs>`
  );
  parts.push(`<rect width="${w}" height="${horizon}" fill="url(#sky)"/>`);

  if (spec.sun) {
    parts.push(`<circle cx="${spec.sun.x}" cy="${spec.sun.y}" r="${spec.sun.r}" fill="${spec.sun.color}" opacity="0.9"/>`);
  }
  if (spec.night && !spec.indoor) {
    for (let i = 0; i < 14; i++) {
      const x = ((seed + i * 47) % w);
      const y = ((seed + i * 31) % (horizon - 40)) + 10;
      parts.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="#e8e2d2" opacity="0.8"/>`);
    }
  }

  // Distant hills.
  if (!spec.indoor) {
    parts.push(
      `<path d="M0 ${horizon} Q ${w * 0.25} ${horizon - 46} ${w * 0.5} ${horizon - 10} T ${w} ${horizon - 30} V ${horizon} Z" fill="${spec.ground}" opacity="0.55"/>`
    );
  }

  parts.push(`<rect y="${horizon}" width="${w}" height="${h - horizon}" fill="${spec.ground}"/>`);

  // The path or floor.
  if (spec.indoor) {
    parts.push(`<rect y="${horizon}" width="${w}" height="${h - horizon}" fill="${spec.path}"/>`);
    parts.push(`<rect x="70" y="130" width="190" height="120" rx="6" fill="${spec.sky[0]}" opacity="0.5"/>`);
    parts.push(`<rect x="420" y="150" width="150" height="100" rx="6" fill="${spec.sky[1]}" opacity="0.4"/>`);
  } else {
    parts.push(
      `<path d="M ${w * 0.42} ${h} L ${w * 0.48} ${horizon} L ${w * 0.56} ${horizon} L ${w * 0.72} ${h} Z" fill="${spec.path}"/>`
    );
    parts.push(
      `<path d="M ${w * 0.545} ${h} L ${w * 0.525} ${horizon + 8} " stroke="#e8e2d2" stroke-width="3" stroke-dasharray="10 14" opacity="0.6" fill="none"/>`
    );
  }

  // Trees.
  const trees = spec.trees ?? 0;
  for (let i = 0; i < trees; i++) {
    const x = 60 + ((seed + i * 137) % (w - 140));
    if (x > w * 0.4 && x < w * 0.75) continue;
    const th = 34 + ((seed + i * 53) % 26);
    parts.push(`<rect x="${x - 3}" y="${horizon - th + 18}" width="6" height="${th - 14}" fill="#6b5a44"/>`);
    parts.push(`<circle cx="${x}" cy="${horizon - th}" r="${16 + (i % 3) * 4}" fill="#5f7a4f" opacity="0.9"/>`);
  }

  // The bike and rider, small on the path.
  if (withRider) {
  const bx = spec.indoor ? 320 : w * 0.53;
  const by = spec.indoor ? 290 : horizon + 44;
  parts.push(
    `<g stroke="#2e2a26" stroke-width="3.4" fill="none" stroke-linecap="round">` +
      `<circle cx="${bx - 17}" cy="${by}" r="12"/><circle cx="${bx + 17}" cy="${by}" r="12"/>` +
      `<path d="M ${bx - 17} ${by} L ${bx - 4} ${by - 18} L ${bx + 12} ${by - 18} L ${bx + 17} ${by} M ${bx - 4} ${by - 18} L ${bx + 2} ${by} M ${bx - 8} ${by - 22} L ${bx - 1} ${by - 18} M ${bx + 10} ${by - 24} L ${bx + 12} ${by - 18}"/>` +
      `<path d="M ${bx + 1} ${by - 20} L ${bx - 2} ${by - 34} L ${bx - 9} ${by - 42}" stroke-width="4"/>` +
      `<circle cx="${bx - 10}" cy="${by - 48}" r="5" fill="#2e2a26"/>` +
      `</g>`
  );
  }

  if (spec.rain) {
    for (let i = 0; i < 26; i++) {
      const x = (seed + i * 29) % w;
      const y = (seed + i * 71) % (h - 60);
      parts.push(`<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 14}" stroke="#f0f3f4" stroke-width="1.6" opacity="0.55"/>`);
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    parts.join("") +
    `</svg>`
  );
}

/** Simple palette variants for the non-bike demo projects. */
export function genericScene(i: number): SceneSpec {
  const palettes: SceneSpec[] = [
    { sky: ["#e8c9a0", "#e2d7c3"], ground: "#c99e6a", path: "#96764c", sun: { x: 500, y: 70, r: 34, color: "#f2b567" } },
    { sky: ["#bcd4e2", "#e6ede9"], ground: "#8fae9d", path: "#6f8578", trees: 3 },
    { sky: ["#d9a08c", "#c9b8c6"], ground: "#7d6f77", path: "#5f5760", sun: { x: 200, y: 95, r: 40, color: "#f1a45f" } },
    { sky: ["#cfe3ee", "#eef3ef"], ground: "#b9b6ae", path: "#8f8c85", trees: 1 },
    { sky: ["#3d3f52", "#565a70"], ground: "#3a3c48", path: "#4b4e5c", night: true },
    { sky: ["#c8cdd1", "#dde0e0"], ground: "#a3b294", path: "#7d7a72", trees: 4 },
  ];
  return palettes[i % palettes.length];
}
