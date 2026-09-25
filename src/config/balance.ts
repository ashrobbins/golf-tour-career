/**
 * Central balance configuration — §53 of the design spec.
 *
 * Every number in this file is a starting guess, not a tuned value.
 * Nothing outside this file should hardcode a balancing constant —
 * systems read from here so the whole career curve can be retuned
 * from one place once we can actually playtest it.
 */

export const seasonConfig = {
  tournamentsPerSeason: 20,
  majorSlots: [5, 10, 15, 20] as const,
  regularFieldSize: 10,
  majorFieldSize: 20,
  majorQualificationRank: 300, // finish season <= this rank to qualify next season
};

export const rankingConfig = {
  startingRank: 1000,
  /**
   * Ranking change = (actualScore - expectedScore) * tournamentStrength * scalingFactor(rank)
   * expectedScore/actualScore are 0–1 "percentile of field beaten" values.
   */
  tournamentStrength: {
    regular: 1,
    major: 3,
  },
  /**
   * Diminishing gains as rank improves — the "ranking gravity" from §5/§42.
   * Piecewise multiplier applied on top of tournamentStrength.
   * Rank 1000 -> 1.0, rank 1 -> 0.15 (tunable).
   */
  scalingByRank: [
    { maxRank: 1000, multiplier: 1.0 },
    { maxRank: 500, multiplier: 0.8 },
    { maxRank: 300, multiplier: 0.6 },
    { maxRank: 100, multiplier: 0.35 },
    { maxRank: 50, multiplier: 0.2 },
    { maxRank: 10, multiplier: 0.1 },
    { maxRank: 1, multiplier: 0.05 },
  ],
  baseRankPointsPerTournament: 30, // max theoretical swing before scaling
  /** Elo-style spread controlling how sharply a rank gap predicts head-to-head outcomes. */
  eloSpread: 300,
  minRank: 1,
  maxRank: 1000,
};

export const economyConfig = {
  /** Base coin payout by the player's current rank region, before finish multiplier. */
  earningsByRankRegion: [
    { maxRank: 1000, base: 150 },
    { maxRank: 800, base: 300 },
    { maxRank: 500, base: 600 },
    { maxRank: 300, base: 1200 },
    { maxRank: 100, base: 2500 },
    { maxRank: 1, base: 5000 },
  ],
  majorPurseMultiplier: 6,
  /** Finish-position payout curve; index 0 = winner. Bottom-half finishes taper
   *  off steeply so a poor result barely pays out, instead of the old near-linear
   *  decay that still gave last place a meaningful chunk of the base purse. */
  finishMultiplier: [3.0, 2.0, 1.5, 1.1, 0.8, 0.55, 0.35, 0.2, 0.1, 0.05],
  /**
   * Cost to go from level N to N+1, 1-indexed (upgradeCost[0] = cost of 1->2).
   * Steep curve per §19/§20 — cheap early, exceptional late.
   */
  attributeUpgradeCost: [300, 600, 1200, 2400, 4500, 8500, 16000, 30000, 55000],
  startingAttributePoints: 10,
  startingAttributeMax: 5,
  startingAttributeMin: 1,
};

export const probabilityConfig = {
  baseDifficultyByShotType: {
    safe: 0.8,
    normal: 0.65,
    aggressive: 0.5,
    attack: 0.35,
  },
  attributeEffect: {
    accuracy: 0.025, // per point, applied to shot-landing probability
    power: 0.015, // per point, applied to reach/distance-gated shots
    putting: 0.03, // per point, applied to putting probability
    composure: 0.02, // per point, applied under pressure only
  },
  windPenaltyPerMph: 0.006,
  narrowFairwayPenalty: 0.06,
  pressurePenaltyMax: 0.12, // scaled by pressure 0–1, reduced by composure
  randomVariance: 0.05, // +/- uniform noise applied last
};

export const aiGenerationConfig = {
  totalAIGolfers: 999,
  /** Attribute point budget by rank band — elites get more total points, still distributed unevenly (§34/§35). */
  attributeBudgetByRankBand: [
    { maxRank: 1000, min: 8, max: 14 },
    { maxRank: 500, min: 14, max: 20 },
    { maxRank: 300, min: 18, max: 24 },
    { maxRank: 100, min: 24, max: 30 },
    { maxRank: 50, min: 28, max: 34 },
    { maxRank: 10, min: 32, max: 38 },
    { maxRank: 1, min: 34, max: 40 },
  ],
  formVolatility: 0.05, // max +/- modifier from AI form state
};

export const fieldSelectionConfig = {
  /** How wide a rank window to draw the ~9 AI opponents from, relative to player rank. */
  regularWindow: { spreadBelow: 150, spreadAbove: 100, wildcardChance: 0.15 },
  majorWindow: { spreadBelow: 260, spreadAbove: 260, wildcardChance: 0.05 },
};

export const holesPlayedPerTournament = 5;
