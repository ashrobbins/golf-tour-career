import { rankingConfig } from "../config/balance";
import type { TournamentType } from "../types";

const sortedScalingBands = [...rankingConfig.scalingByRank].sort((a, b) => a.maxRank - b.maxRank);

/** §5/§42 — ranking gravity: the better your current rank, the smaller the multiplier. */
function scalingMultiplierForRank(rank: number): number {
  const band = sortedScalingBands.find((b) => rank <= b.maxRank);
  return band ? band.multiplier : sortedScalingBands[sortedScalingBands.length - 1].multiplier;
}

/**
 * Expected "fraction of the field beaten" based purely on rank gaps —
 * an Elo-style pairwise comparison against every opponent, averaged.
 * Lower rank number = better, so a player ranked below an opponent has
 * an expected win probability > 0.5 against them.
 */
export function computeExpectedScore(playerRank: number, opponentRanks: number[]): number {
  if (opponentRanks.length === 0) return 0.5;
  const total = opponentRanks.reduce((sum, oppRank) => {
    const winProb = 1 / (1 + 10 ** ((playerRank - oppRank) / rankingConfig.eloSpread));
    return sum + winProb;
  }, 0);
  return total / opponentRanks.length;
}

/** Actual "fraction of the field beaten" from a finishing position: winner = 1, last = 0. */
export function computeActualScore(finishPosition: number, fieldSize: number): number {
  if (fieldSize <= 1) return 1;
  return 1 - (finishPosition - 1) / (fieldSize - 1);
}

export interface RankingChangeInput {
  playerRank: number;
  opponentRanks: number[];
  finishPosition: number;
  fieldSize: number;
  tournamentType: TournamentType;
}

export interface RankingChangeResult {
  expectedScore: number;
  actualScore: number;
  rankDelta: number; // positive = improved (rank number went down)
  newRank: number;
}

/**
 * §6's core formula: ranking change = (actual - expected) performance ×
 * tournament strength × rank-based scaling. Beating expectations moves
 * you up; underperforming moves you down — never a flat "top N gains" rule.
 */
export function computeRankingChange(input: RankingChangeInput): RankingChangeResult {
  const expectedScore = computeExpectedScore(input.playerRank, input.opponentRanks);
  const actualScore = computeActualScore(input.finishPosition, input.fieldSize);
  const strength = rankingConfig.tournamentStrength[input.tournamentType];
  const scaling = scalingMultiplierForRank(input.playerRank);

  const rankDelta = Math.round(
    (actualScore - expectedScore) * strength * scaling * rankingConfig.baseRankPointsPerTournament,
  );

  const newRank = Math.min(
    rankingConfig.maxRank,
    Math.max(rankingConfig.minRank, input.playerRank - rankDelta),
  );

  return { expectedScore, actualScore, rankDelta, newRank };
}

/** §13/§14 — Major qualification locks in from the *previous* season's final rank. */
export function qualifiesForMajors(seasonEndingRank: number, qualificationThreshold: number): boolean {
  return seasonEndingRank <= qualificationThreshold;
}
