// Core data structures — see project spec §51 for the source design.

export type Attribute = "accuracy" | "power" | "putting" | "composure";

export interface Attributes {
  accuracy: number; // 1–10
  power: number;
  putting: number;
  composure: number;
}

export type PlayStyle =
  | "balanced"
  | "aggressive"
  | "conservative"
  | "technician"
  | "closer"
  | "volatile";

export type CourseType = "parkland" | "links" | "heathland" | "desert";

export type Gender = "male" | "female" | "other";

export interface Appearance {
  gender: Gender;
  skinTone: string; // hex
  hairStyle: string; // id into a small enum of sprite variants
  hatStyle: string;
  hatColor: string; // hex
  shirtColor: string; // hex
  bottomColor: string; // hex
}

export interface CareerStats {
  wins: number;
  podiums: number;
  top10s: number;
  majorAppearances: number;
  majorWins: number;
  careerEarnings: number;
  highestRank: number;
  tournamentsPlayed: number;
}

export interface PlayerProfile {
  id: "player"; // singleton row
  name: string;
  nationality: string; // ISO country code
  appearance: Appearance;
  attributes: Attributes;
  coins: number;
  rank: number;
  season: number;
  tournamentNumber: number; // 1–20 within the current season
  /** Locked at season end; determines Major access for the *next* season only. */
  majorQualifiedForSeason: number | null;
  seasonStartRank: number; // for "up N this season" deltas
  careerStats: CareerStats;
}

export interface AIGolfer {
  id: string;
  name: string;
  nationality: string;
  attributes: Attributes;
  rank: number;
  style: PlayStyle;
  form: "excellent" | "good" | "normal" | "poor";
  careerStats: Pick<CareerStats, "wins" | "podiums" | "top10s" | "majorWins">;
}

export interface HoleArchetype {
  id: string;
  par: 3 | 4 | 5;
  variant: string; // e.g. "water-carry", "dogleg", "risk-reward"
  baseDifficulty: number; // 0–1, feeds ProbabilitySystem
}

/** Static, bundled with the app — never persisted per-player. */
export interface CourseTemplate {
  id: string;
  name: string; // generated, never a real course name
  location: string; // real place name is fine
  courseType: CourseType;
  parTotal: number;
  baseDifficulty: number; // 1–5 stars
  holes: HoleArchetype[]; // 18 authored/assembled holes
}

export type TournamentType = "regular" | "major";

export interface FieldEntry {
  golferId: string; // AIGolfer id, or "player"
  rank: number;
}

export interface Tournament {
  id: string;
  season: number;
  number: number; // 1–20
  type: TournamentType;
  courseTemplateId: string;
  seed: string; // deterministic course-instance seed
  field: FieldEntry[];
}

export interface PlayedHoleResult {
  holeNumber: number;
  par: number;
  scoreToPar: number; // -2 eagle, -1 birdie, 0 par, +1 bogey, ...
  decision: string; // e.g. "lay-up" | "attack-green" | "attack-putt" | "safe-lag"
}

export interface TournamentHistoryEntry {
  tournamentId: string;
  season: number;
  number: number;
  type: TournamentType;
  courseTemplateId: string;
  finishPosition: number;
  fieldSize: number;
  scoreToPar: number;
  playedHoles: PlayedHoleResult[]; // only the 5 player-controlled holes
  rankBefore: number;
  rankAfter: number;
  earnings: number;
}
