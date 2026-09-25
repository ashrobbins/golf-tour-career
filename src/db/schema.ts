import type { DBSchema } from "idb";
import type { AIGolfer, PlayerProfile, TournamentHistoryEntry } from "../types";

// Courses are NOT a store here — they're static, bundled app data
// (see src/data/courseTemplates.ts), not per-player persisted state.

export interface CareerDB extends DBSchema {
  player: {
    key: string; // always "player"
    value: PlayerProfile;
  };
  aiGolfers: {
    key: string;
    value: AIGolfer;
    indexes: { "by-rank": number };
  };
  tournamentHistory: {
    key: string; // tournamentId
    value: TournamentHistoryEntry;
    indexes: { "by-season": number };
  };
}

export const DB_NAME = "golf-career";
export const DB_VERSION = 1;
