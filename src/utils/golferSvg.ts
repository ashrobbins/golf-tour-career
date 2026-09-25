import golferSvgRaw from "../assets/golfer.svg?raw";
import { hexToHsl, hslToHex } from "./color";
import type { Appearance } from "../types";

// The source SVG is a single traced sprite, shaded with several close hex
// values per body part (highlight/base/shadow) rather than one flat fill
// per region. Each bucket lists every shade that belongs to that part, plus
// a "base" shade — the flat mid-tone the part reads as at a glance — used
// as the reference point for recoloring (see recolorRelativeToBase below).
interface Bucket {
  base: string;
  hexes: string[];
}

const SKIN: Bucket = {
  base: "F2CFAC",
  hexes: [
    "F2CFAC", "CEAE8D", "D6B591", "F4D3B1", "F6D5B3", "F6D3AF", "D2B391",
    "D4B595", "D7B492", "D4B28F", "9C8C7D", "F9E1CB", "6E6762", "C9B297", "EFDAC2",
  ],
};

const HAT: Bucket = {
  base: "33638B",
  hexes: [
    "33638B", "52585E", "214561", "214461", "34638A", "224460", "234560",
    "2C3F52", "202A33", "29343E", "2D475C",
  ],
};

const SHIRT: Bucket = {
  base: "376B98",
  hexes: [
    "376B98", "244560", "22445F", "244662", "416686", "234764", "506171",
    "2D3842", "42627E", "162330", "476C8C", "496D8C", "2D4659", "2C4051",
  ],
};

function buildLookup(bucket: Bucket): Map<string, number> {
  const [, , baseL] = hexToHsl(`#${bucket.base}`);
  const lookup = new Map<string, number>();
  for (const hex of bucket.hexes) {
    const [, , l] = hexToHsl(`#${hex}`);
    lookup.set(hex, l - baseL); // lightness offset from this part's base shade
  }
  return lookup;
}

const SKIN_OFFSETS = buildLookup(SKIN);
const HAT_OFFSETS = buildLookup(HAT);
const SHIRT_OFFSETS = buildLookup(SHIRT);

/** Recolors a shaded fill to a target color, keeping that fill's lightness
 *  *offset* from its part's base shade — so a highlight stays lighter than
 *  the target and a shadow stays darker than it, instead of every shade
 *  collapsing to the target's own exact lightness. */
function recolorRelativeToBase(offsets: Map<string, number>, originalHex: string, targetHex: string): string {
  const offset = offsets.get(originalHex) ?? 0;
  const [h, s, targetL] = hexToHsl(targetHex);
  const l = Math.min(1, Math.max(0, targetL + offset));
  return hslToHex(h, s, l);
}

const FILL_PATTERN = /fill="#([0-9A-Fa-f]{6})"/g;

export function buildGolferSvg(appearance: Pick<Appearance, "skinTone" | "hatColor" | "shirtColor">): string {
  const recolored = golferSvgRaw.replace(FILL_PATTERN, (match, hex: string) => {
    const upper = hex.toUpperCase();
    if (upper === "FEFEFE") return 'fill="none"'; // traced canvas background
    if (SKIN_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(SKIN_OFFSETS, upper, appearance.skinTone)}"`;
    if (HAT_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(HAT_OFFSETS, upper, appearance.hatColor)}"`;
    if (SHIRT_OFFSETS.has(upper)) return `fill="${recolorRelativeToBase(SHIRT_OFFSETS, upper, appearance.shirtColor)}"`;
    return match; // outline, hair, pants, shoes — unchanged
  });

  // The source has fixed width/height and no viewBox, so it can't be
  // scaled by a container. Normalize it into a scalable, centered sprite.
  return recolored.replace(
    /<svg version="1\.1" xmlns="[^"]+" width="992" height="1058">/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 992 1058" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">',
  );
}
