import { holesPlayedPerTournament, seasonConfig } from "../config/balance";
import { courseTemplates } from "../data/courseTemplates";
import type { AIGolfer, Attributes, CourseTemplate, HoleArchetype, PlayerProfile, Tournament } from "../types";
import { selectField } from "./fieldSelection";
import { computePuttingProbability, computeShotProbability, type DifficultyLabel } from "./probability";
import { randFrom, randInt, seededRNG, shuffle, type RNG } from "./rng";
import { tournamentTypeForNumber } from "./season";

/**
 * A season's 20 tournaments each get a distinct course — shuffling the
 * full pool once per season (seeded, so it's stable across repeated calls)
 * and assigning one course per tournament number guarantees no repeats
 * within a season, rather than each tournament picking independently and
 * risking the same course twice. Requires the pool to be at least as large
 * as a season's tournament count.
 */
function courseForTournament(season: number, tournamentNumber: number): CourseTemplate {
  if (courseTemplates.length < seasonConfig.tournamentsPerSeason) {
    throw new Error(
      `Only ${courseTemplates.length} course templates for a ${seasonConfig.tournamentsPerSeason}-tournament season — the no-repeat guarantee needs at least one per tournament.`,
    );
  }
  const order = shuffle(seededRNG(`season-${season}-course-order`), courseTemplates);
  return order[(tournamentNumber - 1) % order.length];
}

export interface PreparedTournament {
  tournament: Tournament;
  course: CourseTemplate;
  field: AIGolfer[]; // opponents only — player is not included here
  playedHoleNumbers: number[]; // 1-indexed, sorted, length = holesPlayedPerTournament
  windMph: number;
  windDirection: string;
}

const windDirections = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];

/** Spreads N picks across the 18 holes so they aren't bunched together —
 *  divides the round into N buckets and takes one random hole from each. */
function pickPlayedHoles(rng: RNG, totalHoles: number, count: number): number[] {
  const bucketSize = totalHoles / count;
  const picks: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.max(start, Math.floor((i + 1) * bucketSize) - 1);
    picks.push(randInt(rng, start, end) + 1); // 1-indexed
  }
  return picks.sort((a, b) => a - b);
}

/**
 * Assembles everything needed to preview and then play the player's next
 * tournament: course, AI field, wind, and which 5 holes are player-controlled
 * (§29/§40). Deterministic per season+tournament number so re-visiting the
 * preview screen doesn't reshuffle the field underneath the player.
 */
export async function prepareTournament(player: PlayerProfile): Promise<PreparedTournament> {
  const type = tournamentTypeForNumber(player.tournamentNumber);
  const tournamentId = `t-${player.season}-${player.tournamentNumber}`;
  const rng = seededRNG(tournamentId);

  const course = courseForTournament(player.season, player.tournamentNumber);

  const field = await selectField(player.rank, type, seededRNG(`${tournamentId}-field`));
  const playedHoleNumbers = pickPlayedHoles(seededRNG(`${tournamentId}-holes`), course.holes.length, holesPlayedPerTournament);

  const windMph = randInt(rng, 4, 18);
  const windDirection = randFrom(rng, windDirections);

  const tournament: Tournament = {
    id: tournamentId,
    season: player.season,
    number: player.tournamentNumber,
    type,
    courseTemplateId: course.id,
    seed: tournamentId,
    field: [
      { golferId: "player", rank: player.rank },
      ...field.map((g) => ({ golferId: g.id, rank: g.rank })),
    ],
  };

  return { tournament, course, field, playedHoleNumbers, windMph, windDirection };
}

const yardageRangeByPar: Record<3 | 4 | 5, [number, number]> = {
  3: [140, 225],
  4: [320, 465],
  5: [480, 585],
};

export function yardageForHole(tournamentId: string, hole: HoleArchetype): number {
  const rng = seededRNG(`${tournamentId}-yds-${hole.id}`);
  const [min, max] = yardageRangeByPar[hole.par];
  return randInt(rng, min, max);
}

export function isNarrowHole(hole: HoleArchetype): boolean {
  return ["narrow", "dogleg", "risk-reward", "water", "water-carry", "bunker-heavy"].includes(hole.variant);
}

/**
 * Neutral one-check-per-hole simulation for a golfer who isn't making a
 * real decision on this hole — either the player's own non-played holes,
 * or an AI golfer's entire round (AI never gets a decision UI, every hole
 * is "simulated" for them). Seeded per (tournament, hole, actor) so it's
 * reproducible in isolation — the same call always gives the same answer,
 * which is what lets a "live" partial read (through N holes) and the
 * final full-round total be built from the exact same underlying results
 * rather than two independent random draws.
 */
export function simulatedHoleScore(
  tournamentId: string,
  holeNumber: number,
  hole: HoleArchetype,
  attributes: Attributes,
  actorId: string,
): number {
  const rng = seededRNG(`${tournamentId}-simulate-${actorId}-${holeNumber}`);
  const resolution = computeShotProbability({
    shotType: "normal",
    attributes,
    narrowFairway: isNarrowHole(hole),
    rng,
  });
  return resolution.success ? 0 : 1;
}

/** Sums simulatedHoleScore for holes 1..throughHole — the shared basis for
 *  both a live in-progress read and the final round total. */
export function simulateGolferScoreThroughHole(
  tournamentId: string,
  course: CourseTemplate,
  golferId: string,
  attributes: Attributes,
  throughHole: number,
): number {
  let total = 0;
  for (let h = 1; h <= throughHole; h++) {
    total += simulatedHoleScore(tournamentId, h, course.holes[h - 1], attributes, golferId);
  }
  return total;
}

// ---- Multi-stage hole play (§24/§26): every player-controlled hole is a
// short sequence of decisions — tee shot, then (for par 4/5) an approach,
// then the putt. The sequence isn't fixed up front, though: if the shot
// that was supposed to reach the green (the tee on a par 3, the approach
// on a par 4/5) actually misses, a recovery stage gets inserted before the
// putt — you don't get to putt from the rough. ----

export type ShotChoice = "safe" | "attack";
export type StageType = "tee" | "approach" | "recovery" | "putt";

export interface StageDef {
  type: StageType;
  title: string;
  safeLabel: string;
  safeDescription: string;
  attackLabel: string;
  attackDescription: string;
}

const teeStage: StageDef = {
  type: "tee",
  title: "TEE SHOT",
  safeLabel: "CONSERVATIVE",
  safeDescription: "Keep it in play — find the fairway.",
  attackLabel: "AGGRESSIVE",
  attackDescription: "Attack the tee shot for the best angle in.",
};

function approachStageFor(par: 3 | 4 | 5): StageDef {
  // "Lay Up" only makes sense as a label on a par 5's second shot — you're
  // laying up short of the green entirely. On a par 4 you're already
  // playing the approach itself, so the safe option is about shot
  // selection (center of the green), not laying up short.
  return {
    type: "approach",
    title: par === 5 ? "SECOND SHOT" : "APPROACH",
    safeLabel: par === 5 ? "LAY UP" : "PERCENTAGE PLAY",
    safeDescription:
      par === 5
        ? "Short and safe — leaves a simple next shot."
        : "Aim for the center of the green — no hero shots.",
    attackLabel: par === 5 ? "GO FOR IT" : "ATTACK THE PIN",
    attackDescription: par === 5 ? "Go for the green in two." : "Fire right at the flag.",
  };
}

const recoveryStage: StageDef = {
  type: "recovery",
  title: "RECOVERY SHOT",
  safeLabel: "PLAY SAFE",
  safeDescription: "Take your medicine — get it back on the green, no heroics.",
  attackLabel: "GO FOR IT",
  attackDescription: "Thread it close and try to save your score.",
};

const puttStage: StageDef = {
  type: "putt",
  title: "THE PUTT",
  safeLabel: "SAFE LAG",
  safeDescription: "Die it near the cup — reliable two-putt.",
  attackLabel: "ATTACK",
  attackDescription: "Firm pace at the hole for birdie.",
};

/**
 * Builds the stage sequence for a hole, given what's happened so far this
 * hole. Only returns stages up to the point that's actually determined —
 * whether a recovery stage exists depends on whether the "reach the green"
 * shot (tee on a par 3, approach on a par 4/5) succeeded, which isn't known
 * until that stage resolves. Called fresh each render with the outcomes
 * accumulated so far, so the sequence grows as the hole is played.
 */
export function buildStageSequence(par: 3 | 4 | 5, nonPuttOutcomesSoFar: StageOutcome[]): StageDef[] {
  if (par === 3) {
    const reachedGreen = nonPuttOutcomesSoFar[0]?.success;
    if (reachedGreen === undefined) return [teeStage];
    return reachedGreen ? [teeStage, puttStage] : [teeStage, recoveryStage, puttStage];
  }

  const approach = approachStageFor(par);
  const reachedGreen = nonPuttOutcomesSoFar[1]?.success;
  if (reachedGreen === undefined) return [teeStage, approach];
  return reachedGreen ? [teeStage, approach, puttStage] : [teeStage, approach, recoveryStage, puttStage];
}

export interface StageOutcome {
  type: StageType;
  shotType: ShotChoice;
  success: boolean;
}

export interface StageResolution {
  success: boolean;
  difficultyLabel: DifficultyLabel;
}

/** Resolves a tee or approach stage. Deterministic per (tournament, hole, stage index, choice). */
export function resolveShotStage(input: {
  tournamentId: string;
  holeNumber: number;
  stageIndex: number;
  hole: HoleArchetype;
  shotType: ShotChoice;
  attributes: Attributes;
  windMph: number;
  pressure: number;
  /** Set when this choice is an attempt to reach the green from `distanceYards` —
   *  the approach stage, a par 3's tee shot, or a recovery shot. Gates the
   *  attack option's odds by how far out of the player's range it is. */
  greenReachAttempt?: { distanceYards: number };
}): StageResolution {
  const rng = seededRNG(`${input.tournamentId}-stage-${input.holeNumber}-${input.stageIndex}-${input.shotType}`);
  const distanceMultiplier =
    input.greenReachAttempt && input.shotType === "attack"
      ? greenReachMultiplier(input.greenReachAttempt.distanceYards, input.attributes.accuracy, input.attributes.power)
      : undefined;
  const resolution = computeShotProbability({
    shotType: input.shotType,
    attributes: input.attributes,
    windMph: input.windMph,
    narrowFairway: isNarrowHole(input.hole),
    pressure: input.pressure,
    distanceMultiplier,
    rng,
  });
  return { success: resolution.success, difficultyLabel: resolution.difficultyLabel };
}

/**
 * How far a player with these attributes can plausibly expect to fly a
 * ball toward the green. A brand-new #1000 golfer (low single-digit
 * accuracy/power) has no business challenging a green from 250+ yards —
 * that's not a "risky" shot, it's not a real option yet. Roughly: a short
 * wedge (60yds) is always in range; every combined accuracy+power point
 * adds ~15 more yards of realistic reach.
 */
export function maxReachableYards(accuracy: number, power: number): number {
  return 60 + (accuracy + power) * 15;
}

/**
 * 1 = no penalty (comfortably in range), tapering to 0 (no realistic
 * chance) well beyond the player's plausible reach. At exactly their max
 * reach, this lands around 0.25–0.3 — a real but rare "got away with one,"
 * not a coin flip.
 */
export function greenReachMultiplier(distanceYards: number, accuracy: number, power: number): number {
  const maxReach = maxReachableYards(accuracy, power);
  const r = distanceYards / maxReach;
  if (r <= 0.5) return 1;
  if (r >= 1.2) return 0;
  return 1 - (r - 0.5) / 0.7;
}

/** Whether attempting to reach the green from here is a real option at all
 *  (vs. a near-impossible hero shot) — used to decide whether the "safe"
 *  option should be framed as "aim for the green safely" or "take your
 *  medicine, you're not getting there." */
export function canPlausiblyReachGreen(distanceYards: number, accuracy: number, power: number): boolean {
  return distanceYards <= maxReachableYards(accuracy, power) * 1.2;
}

/** How far off the pin the ball sits once the putt stage begins — closer
 *  in from successful aggressive play earlier in the hole, farther out
 *  after a fluffed shot. */
export function puttDistanceFeet(nonPuttOutcomes: StageOutcome[]): number {
  let distance = 18;
  for (const outcome of nonPuttOutcomes) {
    if (outcome.success) {
      distance -= outcome.shotType === "attack" ? 7 : 3;
    } else {
      distance += 9;
    }
  }
  return Math.min(40, Math.max(3, distance));
}

/** Resolves the putt stage. Deterministic per (tournament, hole, choice). */
export function resolvePuttStage(input: {
  tournamentId: string;
  holeNumber: number;
  distanceFeet: number;
  shotType: ShotChoice;
  attributes: Attributes;
  pressure: number;
}): StageResolution {
  const rng = seededRNG(`${input.tournamentId}-putt-${input.holeNumber}-${input.shotType}`);
  const resolution = computePuttingProbability({
    distanceFeet: input.distanceFeet,
    putting: input.attributes.putting,
    composure: input.attributes.composure,
    pressure: input.pressure,
    strategy: input.shotType === "attack" ? "attack" : "safe",
    rng,
  });
  return { success: resolution.success, difficultyLabel: resolution.difficultyLabel };
}

/**
 * Turns a hole's full stage sequence into a score relative to par.
 * +1 per missed tee/approach shot; playing every non-putt stage aggressively
 * and landing them all sets up a better look (-1) before the putt is even
 * struck; the putt itself adds -1 on a successful Attack, or +1 on a miss.
 * A clean all-aggressive par-5 with a made Attack putt can eagle; a missed
 * tee shot with a missed putt can go to double bogey — same shape as the
 * old single-decision model, just built from real sub-decisions now.
 */
export function computeHoleScoreFromStages(
  nonPuttOutcomes: StageOutcome[],
  puttOutcome: StageOutcome,
): number {
  const failCount = nonPuttOutcomes.filter((o) => !o.success).length;
  const allAggressive = nonPuttOutcomes.length > 0 && nonPuttOutcomes.every((o) => o.shotType === "attack");
  const allSucceeded = nonPuttOutcomes.every((o) => o.success);

  let score = failCount;
  if (allSucceeded && allAggressive) score -= 1;

  if (puttOutcome.success) {
    score += puttOutcome.shotType === "attack" ? -1 : 0;
  } else {
    score += 1;
  }

  return score;
}

// ---- Shot situation (§28: the player should see where they actually are,
// not just pick blind) ----

export type Lie = "TEE" | "FAIRWAY" | "ROUGH" | "GREEN";

export interface ShotSituation {
  lie: Lie;
  distanceYards: number | null; // set for tee/approach stages
  distanceFeet: number | null; // set for the putt stage
}

/**
 * Where the ball actually sits going into the current stage — a bad
 * tee shot leaves you in the rough with more distance left, a good
 * aggressive one leaves a short, clean look. Purely a function of the
 * stages already played this hole, so it's consistent on re-render.
 */
export function situationForStage(
  holeYardage: number,
  stage: StageDef,
  nonPuttOutcomesSoFar: StageOutcome[],
): ShotSituation {
  if (stage.type === "tee") {
    return { lie: "TEE", distanceYards: holeYardage, distanceFeet: null };
  }
  if (stage.type === "approach") {
    const teeOutcome = nonPuttOutcomesSoFar[0];
    const lie: Lie = teeOutcome?.success ? "FAIRWAY" : "ROUGH";
    const advanceFraction = !teeOutcome?.success ? 0.4 : teeOutcome.shotType === "attack" ? 0.72 : 0.55;
    const distanceYards = Math.max(40, Math.round(holeYardage * (1 - advanceFraction)));
    return { lie, distanceYards, distanceFeet: null };
  }
  if (stage.type === "recovery") {
    // Recovery only ever follows a missed green, so the lie is always
    // trouble — and the distance is a short chip/pitch, not a fraction of
    // the hole's full length (missing a 580-yard par 5's green in three
    // still leaves you with a short shot, not a 200-yard one).
    const distanceYards = Math.max(15, Math.round(holeYardage * 0.12));
    return { lie: "ROUGH", distanceYards, distanceFeet: null };
  }
  // putt
  return { lie: "GREEN", distanceYards: null, distanceFeet: puttDistanceFeet(nonPuttOutcomesSoFar) };
}

// ---- Result flavor text — "SHOT LANDED" reads the same for a drained
// eagle putt as a foot-wedge out of the trees, which tells the player
// nothing. Each stage type gets its own pool of outcome-specific lines. ----

const flavorPools: Record<StageType, { success: string[]; fail: string[] }> = {
  tee: {
    success: ["GREAT DRIVE", "PURE STRIKE", "SPLIT THE FAIRWAY", "PIPED IT DOWN THE MIDDLE"],
    fail: ["SLICED IT", "PULLED INTO THE ROUGH", "CAUGHT IT THIN", "BLOCKED RIGHT"],
  },
  approach: {
    success: ["STUCK IT CLOSE", "ON THE DANCE FLOOR", "FLAG HIGH", "NAILED THE APPROACH"],
    fail: ["FOUND THE BUNKER", "CAME UP SHORT", "BLOCKED BY TREES", "OVER THE GREEN"],
  },
  recovery: {
    success: ["UP AND IN RANGE", "GREAT RECOVERY", "SAFELY ON THE GREEN", "CHIPPED IT CLOSE"],
    fail: ["STILL IN TROUBLE", "CAUGHT ANOTHER BUNKER", "BLADED IT LONG", "CHUNKED THE CHIP"],
  },
  putt: {
    success: ["SUNK THE PUTT", "DRAINED IT", "CENTRE CUP", "DEAD CENTRE"],
    fail: ["LIPPED OUT", "RACED PAST", "TERRIBLE READ", "LEFT IT SHORT"],
  },
};

/** A safe-strategy putt has its own, calmer success pool (it was never
 *  trying to be dramatic). */
const safePuttSuccessFlavors = ["TAPPED IN", "SAFELY DOWN", "NO DRAMA", "TWO-PUTT SECURED"];

export function resultHeadline(
  tournamentId: string,
  holeNumber: number,
  stageIndex: number,
  stageType: StageType,
  shotType: ShotChoice,
  success: boolean,
): string {
  const pool =
    stageType === "putt" && shotType === "safe" && success
      ? safePuttSuccessFlavors
      : success
        ? flavorPools[stageType].success
        : flavorPools[stageType].fail;
  const rng = seededRNG(`${tournamentId}-flavor-${holeNumber}-${stageIndex}-${shotType}-${success}`);
  return randFrom(rng, pool);
}

// ---- Hole-complete commentary — a short recap shown between holes, so
// the round reads as a story ("a gritty par after a great recovery") and
// not just a sequence of disconnected shot results. ----

const holeCommentaryPools = {
  eagle: ["EAGLE! An outstanding hole.", "Eagle! About as good as it gets.", "Eagle — that's how it's done."],
  birdie: ["Birdie — really nicely played.", "Birdie banked. Good hole.", "Birdie, clean from tee to green."],
  parClean: ["A solid par. No fuss.", "Routine par, and on to the next.", "Par, exactly as drawn up."],
  parRecovery: [
    "A gritty par after a great recovery.",
    "Scrambled home for par — good save.",
    "Missed the green but saved par anyway.",
  ],
  bogeyClean: ["Bogey — a shot gets away.", "Just missed out. Bogey.", "Bogey. Can't win them all."],
  bogeyRecovery: [
    "The recovery couldn't quite save it — bogey.",
    "A tough break leads to bogey.",
    "Bogey, after a fight to get back in position.",
  ],
  worse: ["A tough hole — the trouble compounds.", "That one bites back.", "A hole to forget."],
} as const;

export function holeCommentary(
  tournamentId: string,
  holeNumber: number,
  scoreToPar: number,
  hadRecovery: boolean,
): string {
  const pool: readonly string[] =
    scoreToPar <= -2
      ? holeCommentaryPools.eagle
      : scoreToPar === -1
        ? holeCommentaryPools.birdie
        : scoreToPar === 0
          ? hadRecovery
            ? holeCommentaryPools.parRecovery
            : holeCommentaryPools.parClean
          : scoreToPar === 1
            ? hadRecovery
              ? holeCommentaryPools.bogeyRecovery
              : holeCommentaryPools.bogeyClean
            : holeCommentaryPools.worse;
  const rng = seededRNG(`${tournamentId}-commentary-${holeNumber}`);
  return randFrom(rng, pool);
}

// ---- Final standings — the AI field never played a single hole for real,
// so their 18-hole scores come from the same neutral single-check-per-hole
// simulation used for the player's own non-played holes (§36: AI shouldn't
// secretly play by different rules). ----

export interface StandingEntry {
  id: string;
  name: string;
  rank: number;
  style: AIGolfer["style"];
  scoreToPar: number;
  isPlayer: boolean;
  position: number; // 1-indexed, ties share a position (T-3rd etc.)
}

export function simulateAIRoundScore(tournamentId: string, course: CourseTemplate, golfer: AIGolfer): number {
  return simulateGolferScoreThroughHole(tournamentId, course, golfer.id, golfer.attributes, course.holes.length);
}

function assignStandingPositions(entries: Omit<StandingEntry, "position">[]): StandingEntry[] {
  const sorted = [...entries].sort((a, b) => a.scoreToPar - b.scoreToPar);
  let lastScore: number | null = null;
  let lastPosition = 0;
  return sorted.map((entry, index) => {
    if (entry.scoreToPar !== lastScore) {
      lastPosition = index + 1;
      lastScore = entry.scoreToPar;
    }
    return { ...entry, position: lastPosition };
  });
}

export function buildFinalStandings(
  tournamentId: string,
  course: CourseTemplate,
  field: AIGolfer[],
  player: { rank: number; scoreToPar: number },
): StandingEntry[] {
  return assignStandingPositions([
    ...field.map((g) => ({
      id: g.id,
      name: g.name,
      rank: g.rank,
      style: g.style,
      scoreToPar: simulateAIRoundScore(tournamentId, course, g),
      isPlayer: false,
    })),
    { id: "player", name: "You", rank: player.rank, style: "balanced" as const, scoreToPar: player.scoreToPar, isPlayer: true },
  ]);
}

/**
 * The same standings, but read partway through the round: the AI field's
 * scores are built from the exact same per-hole results the final
 * standings will use (simulateGolferScoreThroughHole is a strict prefix of
 * simulateAIRoundScore's full sum), just cut off at `holesElapsed` — so a
 * golfer shown leading here is leading for a real, consistent reason, not
 * a throwaway estimate that gets thrown out at the final tally.
 */
export function buildLiveStandings(
  tournamentId: string,
  course: CourseTemplate,
  field: AIGolfer[],
  player: { rank: number; scoreToPar: number },
  holesElapsed: number,
): StandingEntry[] {
  return assignStandingPositions([
    ...field.map((g) => ({
      id: g.id,
      name: g.name,
      rank: g.rank,
      style: g.style,
      scoreToPar: simulateGolferScoreThroughHole(tournamentId, course, g.id, g.attributes, holesElapsed),
      isPlayer: false,
    })),
    { id: "player", name: "You", rank: player.rank, style: "balanced" as const, scoreToPar: player.scoreToPar, isPlayer: true },
  ]);
}
