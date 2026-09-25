import { aiGenerationConfig } from "../config/balance";
import { nationalities } from "../data/names";
import type { AIGolfer, Attributes, PlayStyle } from "../types";
import { randFrom, randInt, seededRNG, shuffle, type RNG } from "./rng";

const playStyles: PlayStyle[] = ["balanced", "aggressive", "conservative", "technician", "closer", "volatile"];

const sortedBudgetBands = [...aiGenerationConfig.attributeBudgetByRankBand].sort(
  (a, b) => a.maxRank - b.maxRank,
);

function budgetForRank(rank: number): { min: number; max: number } {
  const band = sortedBudgetBands.find((b) => rank <= b.maxRank);
  return band ?? sortedBudgetBands[sortedBudgetBands.length - 1];
}

/**
 * Distributes a points budget across the 4 attributes unevenly (§34/§35 —
 * elite golfers should have distinct strengths/weaknesses, not identical
 * maxed-out stats). Each attribute is clamped to 1–10.
 */
function distributeAttributes(rng: RNG, totalPoints: number): Attributes {
  const keys: (keyof Attributes)[] = ["accuracy", "power", "putting", "composure"];
  const values: Attributes = { accuracy: 1, power: 1, putting: 1, composure: 1 };
  let remaining = totalPoints - 4; // each starts at 1

  // Give each attribute a random "affinity" weight so some golfers lean
  // heavily into one or two stats rather than spreading evenly.
  const weights = keys.map(() => 0.3 + rng() * 1.2);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const order = shuffle(rng, keys.map((k, i) => ({ key: k, weight: weights[i] / weightSum })));

  for (const { key, weight } of order) {
    if (remaining <= 0) break;
    const share = Math.min(remaining, Math.round(weight * (totalPoints - 4)));
    const capped = Math.min(share, 9); // leave room, 1 + 9 = 10 max
    values[key] = Math.min(10, values[key] + capped);
    remaining -= capped;
  }
  // Any leftover points (rounding) go to a random attribute, capped at 10.
  while (remaining > 0) {
    const key = randFrom(rng, keys);
    if (values[key] < 10) {
      values[key] += 1;
      remaining -= 1;
    } else if (keys.every((k) => values[k] >= 10)) {
      break; // fully maxed, nowhere left to put points
    }
  }
  return values;
}

export function generateAIRoster(): AIGolfer[] {
  const rng = seededRNG("ai-roster-v1");
  const golfers: AIGolfer[] = [];

  for (let rank = 1; rank <= aiGenerationConfig.totalAIGolfers; rank++) {
    const nationality = randFrom(rng, nationalities);
    const firstName = randFrom(rng, nationality.firstNames);
    const lastName = randFrom(rng, nationality.lastNames);
    const { min, max } = budgetForRank(rank);
    const totalPoints = randInt(rng, min, max);

    golfers.push({
      id: `ai-${rank}`,
      name: rank === 1 ? "Tyga Would" : `${firstName} ${lastName}`,
      nationality: nationality.code,
      attributes: distributeAttributes(rng, totalPoints),
      rank,
      style: randFrom(rng, playStyles),
      form: "normal",
      careerStats: { wins: 0, podiums: 0, top10s: 0, majorWins: 0 },
    });
  }

  return golfers;
}
