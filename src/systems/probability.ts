import { probabilityConfig } from "../config/balance";
import type { Attributes } from "../types";

export type ShotType = keyof typeof probabilityConfig.baseDifficultyByShotType;

export interface ShotContext {
  shotType: ShotType;
  attributes: Attributes;
  windMph?: number;
  narrowFairway?: boolean;
  /** 0–1, how much pressure is on this shot (hole/leaderboard/tournament context). */
  pressure?: number;
  /** 0–1 multiplier applied on top of everything else — used for shots that
   *  are attempting to reach the green from a distance the player's
   *  attributes can't realistically cover yet (see greenReachMultiplier in
   *  systems/tournament.ts). 1 = no penalty. */
  distanceMultiplier?: number;
  rng: () => number; // caller supplies a seeded RNG for reproducibility
}

export type DifficultyLabel = "Very Safe" | "Safe" | "Moderate" | "Difficult" | "Very Difficult" | "Extreme";
export type RewardLabel = "Low" | "Moderate" | "High" | "Huge";

export interface ShotResolution {
  probability: number; // internal only — never shown to the player (§21)
  success: boolean;
  difficultyLabel: DifficultyLabel;
}

/**
 * §21's formula: base difficulty + attribute effects + course/weather
 * effects + pressure/composure effects + small random variation.
 * Returns a 0–1 success probability, clamped, plus the resolved outcome.
 */
export function computeShotProbability(ctx: ShotContext): ShotResolution {
  const cfg = probabilityConfig;
  let p = cfg.baseDifficultyByShotType[ctx.shotType];

  p += ctx.attributes.accuracy * cfg.attributeEffect.accuracy;
  p += ctx.attributes.power * cfg.attributeEffect.power * (ctx.shotType === "attack" ? 1 : 0.4);

  if (ctx.windMph) {
    p -= ctx.windMph * cfg.windPenaltyPerMph;
  }
  if (ctx.narrowFairway) {
    p -= cfg.narrowFairwayPenalty;
  }
  if (ctx.pressure) {
    const composureRelief = ctx.attributes.composure * cfg.attributeEffect.composure;
    const pressurePenalty = Math.max(0, cfg.pressurePenaltyMax * ctx.pressure - composureRelief);
    p -= pressurePenalty;
  }

  const noise = (ctx.rng() * 2 - 1) * cfg.randomVariance;
  p = clamp01(p + noise);

  if (ctx.distanceMultiplier !== undefined) {
    p = clamp01(p * ctx.distanceMultiplier);
  }

  return {
    probability: p,
    success: ctx.rng() < p,
    difficultyLabel: toDifficultyLabel(p),
  };
}

export function computePuttingProbability(ctx: {
  distanceFeet: number;
  putting: number;
  composure: number;
  pressure?: number;
  strategy: "attack" | "safe";
  rng: () => number;
}): ShotResolution {
  const cfg = probabilityConfig;
  // Distance is the dominant factor for putting; scale down 3ft (easy) to 40ft (very hard).
  const distanceFactor = clamp01(1 - ctx.distanceFeet / 45);
  let p = ctx.strategy === "attack" ? 0.3 + distanceFactor * 0.55 : 0.55 + distanceFactor * 0.4;

  p += ctx.putting * cfg.attributeEffect.putting;
  if (ctx.pressure) {
    const composureRelief = ctx.composure * cfg.attributeEffect.composure;
    p -= Math.max(0, cfg.pressurePenaltyMax * ctx.pressure - composureRelief);
  }

  const noise = (ctx.rng() * 2 - 1) * cfg.randomVariance;
  p = clamp01(p + noise);

  return { probability: p, success: ctx.rng() < p, difficultyLabel: toDifficultyLabel(p) };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function toDifficultyLabel(p: number): DifficultyLabel {
  if (p >= 0.85) return "Very Safe";
  if (p >= 0.68) return "Safe";
  if (p >= 0.5) return "Moderate";
  if (p >= 0.32) return "Difficult";
  if (p >= 0.15) return "Very Difficult";
  return "Extreme";
}

export function rewardLabelForShotType(shotType: ShotType): RewardLabel {
  switch (shotType) {
    case "safe":
      return "Low";
    case "normal":
      return "Moderate";
    case "aggressive":
      return "High";
    case "attack":
      return "Huge";
  }
}
