import { useMemo } from "react";
import { buildGolferHeadshotSvg } from "../utils/golferHeadshotSvg";
import type { Appearance } from "../types";

interface GolferHeadshotProps {
  appearance: Pick<Appearance, "skinTone" | "hatColor" | "shirtColor">;
  size?: number;
}

export function GolferHeadshot({ appearance, size = 44 }: GolferHeadshotProps) {
  const svg = useMemo(
    () => buildGolferHeadshotSvg(appearance),
    [appearance.skinTone, appearance.hatColor, appearance.shirtColor],
  );

  return (
    <div
      style={{ width: size, height: size, flexShrink: 0 }}
      // Our own bundled asset, recolored by our own code — safe to inject.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
