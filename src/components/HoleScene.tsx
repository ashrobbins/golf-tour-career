import flag from "../assets/flag.png";
import { courseTypePalettes } from "../data/courseTypePalettes";
import type { Lie } from "../systems/tournament";
import type { CourseType } from "../types";

const lieLabel: Record<Lie, string> = {
  TEE: "ON THE TEE",
  FAIRWAY: "FAIRWAY",
  ROUGH: "IN THE ROUGH",
  GREEN: "ON THE GREEN",
};

interface HoleSceneProps {
  lie: Lie;
  distanceYards: number;
  courseType: CourseType;
}

/** Fairway/tee scene — sky, fairway, flag, and a chip telling the player
 *  exactly where they stand before they decide the next shot. Colors come
 *  from the course type so a desert round actually looks washed-out and
 *  sandy, not the same lush green as a parkland one. */
export function HoleScene({ lie, distanceYards, courseType }: HoleSceneProps) {
  const palette = courseTypePalettes[courseType];
  const inRough = lie === "ROUGH";
  const groundColors = inRough ? palette.rough : palette.fairway;

  return (
    <div
      style={{
        position: "relative",
        height: 208,
        overflow: "hidden",
        borderBottom: "4px solid var(--pa-ink)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(0deg, ${palette.sky[0]} 0 8px, ${palette.sky[1]} 8px 16px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 128,
          background: `repeating-linear-gradient(90deg, ${groundColors[0]} 0 20px, ${groundColors[1]} 20px 40px)`,
        }}
      />
      {inRough && !palette.roughIsSand && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 128,
            background: "repeating-linear-gradient(45deg, rgba(20,37,26,0.12) 0 4px, transparent 4px 10px)",
          }}
        />
      )}
      {inRough && palette.roughIsSand && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 128,
            background: "repeating-radial-gradient(circle, rgba(20,37,26,0.08) 0 2px, transparent 2px 14px)",
          }}
        />
      )}

      {/* ball */}
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 24,
          width: 12,
          height: 12,
          background: "#f4e9c1",
          border: "3px solid var(--pa-ink)",
        }}
      />
      {/* flag — a single pole+flag sprite instead of CSS-drawn shapes. */}
      <img
        src={flag}
        alt=""
        style={{
          position: "absolute",
          right: 40,
          bottom: 96,
          height: 72,
          width: "auto",
          imageRendering: "pixelated",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          display: "flex",
          gap: 6,
        }}
      >
        <div
          className="pa-title"
          style={{
            background: "var(--pa-ink)",
            color: "var(--pa-parchment)",
            fontSize: 9,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {distanceYards} YDS
        </div>
        <div
          style={{
            background: lie === "ROUGH" ? "var(--pa-coral)" : "var(--pa-ink)",
            color: lie === "ROUGH" ? "var(--pa-ink)" : "var(--pa-parchment)",
            fontFamily: "var(--pa-font-body)",
            fontSize: 16,
            padding: "4px 8px",
            border: lie === "ROUGH" ? "2px solid var(--pa-ink)" : "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          {lieLabel[lie]}
        </div>
      </div>
    </div>
  );
}
