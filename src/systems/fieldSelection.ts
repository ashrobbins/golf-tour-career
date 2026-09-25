import { aiGenerationConfig, fieldSelectionConfig } from "../config/balance";
import { getAIGolfersInRankRange } from "../db";
import type { AIGolfer, TournamentType } from "../types";
import { shuffle, type RNG } from "./rng";
import { fieldSizeForType } from "./season";

/**
 * §15/§16 — draws AI opponents from a ranking window around the player,
 * with an occasional wildcard pulled from outside that window so upsets
 * and rivalries can happen without every field looking identical.
 */
export async function selectField(
  playerRank: number,
  tournamentType: TournamentType,
  rng: RNG,
): Promise<AIGolfer[]> {
  const windowCfg =
    tournamentType === "major" ? fieldSelectionConfig.majorWindow : fieldSelectionConfig.regularWindow;
  const neededCount = fieldSizeForType(tournamentType) - 1; // player fills one slot

  const min = Math.max(1, playerRank - windowCfg.spreadBelow);
  const max = Math.min(aiGenerationConfig.totalAIGolfers, playerRank + windowCfg.spreadAbove);

  let candidates = await getAIGolfersInRankRange(min, max);
  if (candidates.length < neededCount) {
    // Rank is near the extremes (close to #1 or #999) — widen to the whole roster.
    candidates = await getAIGolfersInRankRange(1, aiGenerationConfig.totalAIGolfers);
  }

  let selected = shuffle(rng, candidates).slice(0, neededCount);

  if (selected.length > 0 && rng() < windowCfg.wildcardChance) {
    const wideField = await getAIGolfersInRankRange(1, aiGenerationConfig.totalAIGolfers);
    const outsideWindow = wideField.filter((g) => !selected.some((s) => s.id === g.id));
    if (outsideWindow.length > 0) {
      const wildcard = shuffle(rng, outsideWindow)[0];
      selected = [...selected.slice(0, -1), wildcard];
    }
  }

  return selected.sort((a, b) => a.rank - b.rank);
}
