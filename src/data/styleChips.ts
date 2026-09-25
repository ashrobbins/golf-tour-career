import type { PlayStyle } from "../types";

// Matches the original design canvas mockups' color-coded style chips
// (TECH = blue, AGGR = coral, CLOSER = green, BAL = gold), extended with
// two more for the styles the mockups didn't show.
export const styleChip: Record<PlayStyle, { label: string; background: string }> = {
  technician: { label: "TECH", background: "#7ec8e3" },
  aggressive: { label: "AGGR", background: "#f9d7c9" },
  closer: { label: "CLOSER", background: "#b9dcb1" },
  balanced: { label: "BAL", background: "#f0b429" },
  conservative: { label: "CONS", background: "#cbb9e0" },
  volatile: { label: "VOLATILE", background: "#e8a4c4" },
};
