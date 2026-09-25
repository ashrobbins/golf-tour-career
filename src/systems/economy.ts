import { economyConfig } from "../config/balance";
import type { TournamentType } from "../types";

const sortedEarningsBands = [...economyConfig.earningsByRankRegion].sort((a, b) => a.maxRank - b.maxRank);

function baseEarningsForRank(rank: number): number {
  const band = sortedEarningsBands.find((b) => rank <= b.maxRank);
  return band ? band.base : sortedEarningsBands[sortedEarningsBands.length - 1].base;
}

/** §43/§44 — coin payout by rank region, finishing position, and tournament type. */
export function computeEarnings(input: {
  playerRank: number;
  finishPosition: number;
  tournamentType: TournamentType;
}): number {
  const base = baseEarningsForRank(input.playerRank);
  const curve = economyConfig.finishMultiplier;
  const index = input.finishPosition - 1;
  const multiplier =
    index < curve.length
      ? curve[index]
      : curve[curve.length - 1] * Math.pow(0.75, index - curve.length + 1);

  const purseMultiplier = input.tournamentType === "major" ? economyConfig.majorPurseMultiplier : 1;

  return Math.round(base * multiplier * purseMultiplier);
}

/**
 * Cost to upgrade an attribute from `currentLevel` to `currentLevel + 1`.
 * Returns null once the attribute is already at the cap (10) — §19/§20's
 * steep late-game curve is what keeps upgrades from snowballing.
 */
export function upgradeCost(currentLevel: number): number | null {
  if (currentLevel >= 10) return null;
  const index = currentLevel - 1;
  return economyConfig.attributeUpgradeCost[index] ?? null;
}

export function canAffordUpgrade(coins: number, currentLevel: number): boolean {
  const cost = upgradeCost(currentLevel);
  return cost !== null && coins >= cost;
}
