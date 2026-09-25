import { seasonConfig } from "../config/balance";
import type { TournamentType } from "../types";

export function tournamentTypeForNumber(tournamentNumber: number): TournamentType {
  return (seasonConfig.majorSlots as readonly number[]).includes(tournamentNumber) ? "major" : "regular";
}

export function fieldSizeForType(type: TournamentType): number {
  return type === "major" ? seasonConfig.majorFieldSize : seasonConfig.regularFieldSize;
}

/** §13 — qualification is locked for the *entire* following season, decided only at season end. */
export function qualifiesForNextSeasonMajors(seasonEndingRank: number): boolean {
  return seasonEndingRank <= seasonConfig.majorQualificationRank;
}

export function isSeasonComplete(tournamentNumber: number): boolean {
  return tournamentNumber > seasonConfig.tournamentsPerSeason;
}

/** Advances the tournament counter; caller bumps `season` and re-rolls Major
 *  qualification (via `qualifiesForNextSeasonMajors`) when `rolledOver` is true. */
export function nextTournamentNumber(current: number): { number: number; rolledOver: boolean } {
  if (current >= seasonConfig.tournamentsPerSeason) {
    return { number: 1, rolledOver: true };
  }
  return { number: current + 1, rolledOver: false };
}
