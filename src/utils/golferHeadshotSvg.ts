import golferHeadshotRaw from "../assets/golfer-headshot.svg?raw";
import { hexToHsl, hslToHex } from "./color";
import type { Appearance } from "../types";

// Same recoloring approach as golferSvg.ts, but this is a separate traced
// asset (a head-and-shoulders crop) with its own distinct set of shading
// hexes per part — the two files don't share a fill palette, so each needs
// its own bucket lists and base shade.
interface Bucket {
  base: string;
  hexes: string[];
}

const SKIN: Bucket = {
  base: "F1CEAA",
  hexes: [
    "F1CEAA", "F5D2AE", "D4B28E", "A99684", "C9B096", "D4B99D", "CEB8A4",
    "D4BBA2", "ECD5BD", "C5AE99", "C5AF99", "CBB299", "E9CEB3",
  ],
};

const HAT: Bucket = {
  base: "336590",
  hexes: [
    "274763", "336590", "2D4A64", "32658F", "274764", "274761",
    "264764", "282D30", "335776", "32485D", "5F5F5F",
    "3F6282", "41607F", "3F6381", "33485A", "3F6281", "3D6181", "30455A", "344659",
  ],
};

// 356893, 5E666F and 76716C are large "background" shapes VTracer merged
// from the source photo — each is a single path/fill that happens to span
// from the hat all the way down through the shoulder, so recoloring them as
// hat color was bleeding hat color across most of the shirt area (only the
// few small shirt-only shapes were rendering as shirt color). Bucketing
// them as shirt instead fixes the shoulder without visibly affecting the
// hat, which is otherwise fully covered by the hat-only shapes above.
const SHIRT: Bucket = {
  base: "274661",
  hexes: [
    "356893", "5E666F", "76716C",
    "274661", "2E4A64", "284764", "4C5156", "5F7080", "396083", "385776",
    "36546E", "496888", "32475A", "324459", "486586", "476886", "335C81", "3B6486",
  ],
};

function buildLookup(bucket: Bucket): Map<string, number> {
  const [, , baseL] = hexToHsl(`#${bucket.base}`);
  const lookup = new Map<string, number>();
  for (const hex of bucket.hexes) {
    const [, , l] = hexToHsl(`#${hex}`);
    lookup.set(hex, l - baseL);
  }
  return lookup;
}

const SKIN_OFFSETS = buildLookup(SKIN);
const HAT_OFFSETS = buildLookup(HAT);
const SHIRT_OFFSETS = buildLookup(SHIRT);

function recolorRelativeToBase(offsets: Map<string, number>, originalHex: string, targetHex: string): string {
  const offset = offsets.get(originalHex) ?? 0;
  const [h, s, targetL] = hexToHsl(targetHex);
  const l = Math.min(1, Math.max(0, targetL + offset));
  return hslToHex(h, s, l);
}

const FILL_PATTERN = /fill="#([0-9A-Fa-f]{6})"/g;

export function buildGolferHeadshotSvg(appearance: Pick<Appearance, "skinTone" | "hatColor" | "shirtColor">): string {
  const recolored = golferHeadshotRaw.replace(FILL_PATTERN, (match, hex: string) => {
    const upper = hex.toUpperCase();
    if (upper === "FEFEFE") return 'fill="none"';
    if (SKIN_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(SKIN_OFFSETS, upper, appearance.skinTone)}"`;
    if (HAT_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(HAT_OFFSETS, upper, appearance.hatColor)}"`;
    if (SHIRT_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(SHIRT_OFFSETS, upper, appearance.shirtColor)}"`;
    return match;
  });

  return recolored.replace(
    /<svg version="1\.1" xmlns="[^"]+" width="992" height="1058">/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 992 1058" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">',
  );
}
