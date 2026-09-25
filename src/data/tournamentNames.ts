import { randFrom, seededRNG } from "../systems/rng";
import type { TournamentType } from "../types";

// Generated tournament names — same rule as courses: never reuse a real
// event's name (no "Masters", "The Open", "Ryder Cup", etc.), generic
// descriptors only.

const regularPrefixes = ["Spring", "Summer", "Autumn", "Coastal", "Highland", "Valley", "Riverside", "Northern", "Southern", "Continental"];
const regularSuffixes = ["Open", "Classic", "Invitational", "Championship", "Cup"];

const majorPrefixes = ["The", "The Grand", "The National", "The International"];
const majorSuffixes = ["Championship", "Open Championship", "Invitational Championship", "Cup"];

export function tournamentName(tournamentId: string, type: TournamentType): string {
  const rng = seededRNG(`${tournamentId}-name`);
  if (type === "major") {
    return `${randFrom(rng, majorPrefixes)} ${randFrom(rng, majorSuffixes)}`;
  }
  return `${randFrom(rng, regularPrefixes)} ${randFrom(rng, regularSuffixes)}`;
}
