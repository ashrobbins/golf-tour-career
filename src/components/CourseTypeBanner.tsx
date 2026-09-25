import { courseTypePalettes } from "../data/courseTypePalettes";
import type { CourseType } from "../types";

// Flat placeholder banner — real per-type pixel art comes later (agreed as
// a placeholder for now). Shares its colors with the Gameplay Decision
// scene (courseTypePalettes) so the two screens agree on what each course
// type looks like.
const labelByType: Record<CourseType, string> = {
  links: "LINKS",
  parkland: "PARKLAND",
  heathland: "HEATHLAND",
  desert: "DESERT",
};

interface CourseTypeBannerProps {
  courseType: CourseType;
  location: string;
}

export function CourseTypeBanner({ courseType, location }: CourseTypeBannerProps) {
  const palette = courseTypePalettes[courseType];
  const bg = `linear-gradient(180deg, ${palette.sky[0]} 0%, ${palette.sky[1]} 42%, ${palette.fairway[1]} 42%, ${palette.fairway[0]} 100%)`;
  return (
    <div
      style={{
        position: "relative",
        height: 110,
        borderBottom: "4px solid var(--pa-ink)",
        background: bg,
        flexShrink: 0,
      }}
    >
      <div
        className="pa-title"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "var(--pa-ink)",
          padding: "5px 8px",
          fontSize: 10,
        }}
      >
        {labelByType[courseType]}
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 8,
          background: "var(--pa-ink)",
          color: "var(--pa-parchment)",
          fontFamily: "var(--pa-font-body)",
          fontSize: 14,
          padding: "3px 8px",
        }}
      >
        {location.toUpperCase()}
      </div>
    </div>
  );
}
