import { useMemo } from "react";
import { buildGolferSvg } from "../utils/golferSvg";
import type { Appearance } from "../types";

interface GolferAvatarProps {
  appearance: Pick<Appearance, "skinTone" | "hatColor" | "shirtColor">;
  size?: number;
}

export function GolferAvatar({ appearance, size = 64 }: GolferAvatarProps) {
  const svg = useMemo(
    () => buildGolferSvg(appearance),
    [appearance.skinTone, appearance.hatColor, appearance.shirtColor],
  );

  return (
    <div
      style={{ width: size, height: size, flexShrink: 0 }}
      // The SVG is our own bundled asset, recolored by our own code — not
      // user-supplied content — so injecting it directly is safe here.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
