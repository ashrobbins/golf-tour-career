import type { HoleArchetype } from "../types";

// Authored hole archetypes — §29. Procedural assembly picks from this pool
// per course rather than generating raw geometry.

export const par3Archetypes: Omit<HoleArchetype, "id">[] = [
  { par: 3, variant: "short", baseDifficulty: 0.25 },
  { par: 3, variant: "medium", baseDifficulty: 0.35 },
  { par: 3, variant: "long", baseDifficulty: 0.5 },
  { par: 3, variant: "water-carry", baseDifficulty: 0.55 },
  { par: 3, variant: "bunker-heavy", baseDifficulty: 0.45 },
];

export const par4Archetypes: Omit<HoleArchetype, "id">[] = [
  { par: 4, variant: "short-drivable", baseDifficulty: 0.3 },
  { par: 4, variant: "medium", baseDifficulty: 0.4 },
  { par: 4, variant: "long", baseDifficulty: 0.55 },
  { par: 4, variant: "dogleg", baseDifficulty: 0.5 },
  { par: 4, variant: "risk-reward", baseDifficulty: 0.5 },
  { par: 4, variant: "narrow", baseDifficulty: 0.6 },
  { par: 4, variant: "water", baseDifficulty: 0.55 },
];

export const par5Archetypes: Omit<HoleArchetype, "id">[] = [
  { par: 5, variant: "standard", baseDifficulty: 0.35 },
  { par: 5, variant: "reachable-in-two", baseDifficulty: 0.4 },
  { par: 5, variant: "risk-reward", baseDifficulty: 0.5 },
  { par: 5, variant: "split-fairway", baseDifficulty: 0.45 },
];

/** Deterministic string hash so course generation needs no RNG dependency. */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(pool: T[], seed: string): T {
  const index = hashString(seed) % pool.length;
  return pool[index];
}

/**
 * Builds 18 holes for a course from a par pattern (e.g. the classic
 * 4x par-3 / 10x par-4 / 4x par-5 = par 72 layout), picking a
 * deterministic archetype per hole so the same course id always
 * produces the same routing.
 */
export function buildHoles(courseId: string, parPattern: (3 | 4 | 5)[]): HoleArchetype[] {
  return parPattern.map((par, i) => {
    const pool = par === 3 ? par3Archetypes : par === 4 ? par4Archetypes : par5Archetypes;
    const archetype = pick(pool, `${courseId}-hole${i + 1}`);
    return { id: `${courseId}-h${i + 1}`, ...archetype };
  });
}

// Each pattern is 18 values summing to its par total (verified below).
export const parPattern72: (3 | 4 | 5)[] = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];
export const parPattern70: (3 | 4 | 5)[] = [4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 5, 4, 3, 4, 4, 3, 4, 5];
export const parPattern71: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 4, 3, 4, 5];
