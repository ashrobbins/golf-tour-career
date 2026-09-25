import { rankingConfig, seasonConfig } from "../config/balance";
import { countAIGolfers, getPlayer, savePlayer, saveAIGolfers, clearTournamentHistory } from "../db";
import { hatColors, shirtColors, skinTones } from "../data/appearancePalette";
import type { PlayerProfile } from "../types";
import { generateAIRoster } from "./aiGeneration";

export function defaultPlayerProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: "player",
    name: "New Golfer",
    nationality: "GB",
    appearance: {
      gender: "male",
      skinTone: "#f6d5ab",
      hairStyle: "short",
      hatStyle: "cap",
      hatColor: "#e85d4c",
      shirtColor: "#2f8f8a",
      bottomColor: "#33415c",
    },
    // "Balanced" starter build from §18 — 10 points, max 5 at creation.
    attributes: { accuracy: 3, power: 3, putting: 2, composure: 2 },
    coins: 0,
    rank: rankingConfig.startingRank,
    season: 1,
    tournamentNumber: 1,
    majorQualifiedForSeason: null,
    seasonStartRank: rankingConfig.startingRank,
    careerStats: {
      wins: 0,
      podiums: 0,
      top10s: 0,
      majorAppearances: 0,
      majorWins: 0,
      careerEarnings: 0,
      highestRank: rankingConfig.startingRank,
      tournamentsPlayed: 0,
    },
    ...overrides,
  };
}

/**
 * First-run bootstrap: generates the persistent 999-golfer AI world once.
 * Safe to call on every app start — it's a no-op once the roster exists.
 * Does NOT create a player profile — a brand new install has none, and the
 * Create Your Golfer screen is what creates one (see createPlayer below).
 */
export async function ensureWorldInitialized(): Promise<PlayerProfile | null> {
  const [existingPlayer, aiCount] = await Promise.all([getPlayer(), countAIGolfers()]);

  if (aiCount === 0) {
    const roster = generateAIRoster();
    await saveAIGolfers(roster);
  }

  return existingPlayer ?? null;
}

/** Finalizes a new player from the Create Your Golfer screen's choices. */
export async function createPlayer(input: {
  name: string;
  appearance: PlayerProfile["appearance"];
}): Promise<PlayerProfile> {
  const player = defaultPlayerProfile({ name: input.name, appearance: input.appearance });
  await savePlayer(player);
  return player;
}

/**
 * Wipes rank/coins/career stats/tournament history, resets the name to the
 * default "Golf Guy", and resets appearance colours to each palette's first
 * swatch — a full fresh start.
 */
export async function resetCareer(current: PlayerProfile): Promise<PlayerProfile> {
  await clearTournamentHistory();
  const reset = defaultPlayerProfile({
    name: "Golf Guy",
    appearance: {
      ...current.appearance,
      skinTone: skinTones[0],
      hatColor: hatColors[0],
      shirtColor: shirtColors[0],
    },
  });
  await savePlayer(reset);
  return reset;
}

export const majorQualificationThreshold = seasonConfig.majorQualificationRank;
