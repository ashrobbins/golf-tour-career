interface GreenSceneProps {
  distanceFeet: number;
}

/** Putting-green scene — ball, cup, and an implied breaking line, plus the
 *  distance chip. Matches the fairway scene's "show the real situation"
 *  intent for the putt stage specifically. */
export function GreenScene({ distanceFeet }: GreenSceneProps) {
  return (
    <div
      style={{
        position: "relative",
        height: 208,
        overflow: "hidden",
        borderBottom: "4px solid var(--pa-ink)",
        background: "repeating-linear-gradient(90deg, #58a75d 0 18px, #63b268 18px 36px)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, rgba(20,37,26,0.05) 0 6px, transparent 6px 12px)",
        }}
      />
      {/* ball */}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 24,
          width: 14,
          height: 14,
          background: "#ffffff",
          border: "3px solid var(--pa-ink)",
          borderRadius: "50%",
        }}
      />
      {/* breaking line */}
      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} viewBox="0 0 390 208" preserveAspectRatio="none">
        <path
          d="M 51 180 C 120 150, 220 90, 300 50"
          stroke="var(--pa-ink)"
          strokeWidth="3"
          strokeDasharray="6 8"
          fill="none"
        />
      </svg>
      {/* cup */}
      <div style={{ position: "absolute", right: 78, top: 40, width: 22, height: 22, background: "var(--pa-ink)", borderRadius: "50%" }} />
      <div
        className="pa-title"
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          background: "var(--pa-ink)",
          color: "var(--pa-parchment)",
          fontSize: 11,
          padding: "6px 8px",
        }}
      >
        {distanceFeet} FT
      </div>
    </div>
  );
}
