import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { CourseTypeBanner } from "../components/CourseTypeBanner";
import { FlaticonAttribution } from "../components/FlaticonAttribution";
import { tournamentName } from "../data/tournamentNames";
import { usePlayer } from "../hooks/usePlayer";
import { fieldSizeForType } from "../systems/season";
import { holesPlayedPerTournament } from "../config/balance";
import { prepareTournament, type PreparedTournament } from "../systems/tournament";
import { styleChip } from "../data/styleChips";
import { majorTheme } from "../styles/majorTheme";

export default function CourseFieldPreview() {
  const navigate = useNavigate();
  const { player, loading: playerLoading } = usePlayer();
  const [prepared, setPrepared] = useState<PreparedTournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    let cancelled = false;
    prepareTournament(player)
      .then((result) => {
        if (!cancelled) setPrepared(result);
      })
      .catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [player]);

  if (playerLoading || !player || !prepared) {
    return (
      <div className="pa-screen">
        <div className="pa-content pa-section">
          <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>
            {error ?? "Preparing tournament..."}
          </p>
        </div>
      </div>
    );
  }

  const { tournament, course, field, playedHoleNumbers, windMph, windDirection } = prepared;
  const name = tournamentName(tournament.id, tournament.type);
  const fieldSize = fieldSizeForType(tournament.type);
  const isMajor = tournament.type === "major";
  const m = majorTheme;

  const combinedField = [...field, { id: "player", rank: player.rank, style: "balanced" as const, name: "You" }]
    .sort((a, b) => a.rank - b.rank);

  return (
    <div
      className="pa-screen"
      style={isMajor ? { background: m.screenBg, border: `4px solid ${m.screenBorder}` } : undefined}
    >
      <header className="pa-header" style={isMajor ? { background: m.headerBg, borderBottom: `3px solid ${m.gold}` } : undefined}>
        <BackButton onClick={() => navigate("/")} />
        <div style={{ flexGrow: 1, textAlign: "center" }}>
          <div className="pa-title" style={isMajor ? { color: m.gold } : undefined}>{name.toUpperCase()}</div>
          <div className="pa-subtitle" style={isMajor ? { color: m.muted } : undefined}>
            {isMajor ? "MAJOR" : "REGULAR"} TOURNAMENT · 18 HOLES
          </div>
        </div>
        <div style={{ width: 30, flexShrink: 0 }} />
      </header>

      <div className="pa-content">
        <CourseTypeBanner courseType={course.courseType} location={course.location} />

        <div className="pa-section">
          <div className="pa-section-label" style={isMajor ? { color: m.gold } : undefined}>18-HOLE ROUTING</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {course.holes.map((hole, index) => {
              const holeNumber = index + 1;
              const isPlayed = playedHoleNumbers.includes(holeNumber);
              const cellBg = isMajor ? (isPlayed ? m.gold : m.panelBg) : isPlayed ? "var(--pa-bright-yellow)" : "var(--pa-cream-mid)";
              const cellBorder = isMajor ? `2px solid ${isPlayed ? m.gold : m.panelBorder}` : isPlayed ? "3px solid var(--pa-ink)" : "2px solid var(--pa-ink)";
              const numberColor = isMajor ? (isPlayed ? m.ink : m.cream) : "var(--pa-ink)";
              const parColor = isMajor ? (isPlayed ? m.ink : m.mutedDark) : isPlayed ? "var(--pa-ink)" : "var(--pa-muted-text)";
              return (
                <div
                  key={hole.id}
                  style={{
                    width: "calc((100% - 4px * 8) / 9)",
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: cellBg,
                    border: cellBorder,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontFamily: "var(--pa-font-title)", color: numberColor, fontSize: 12 }}>
                    {holeNumber}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pa-font-body)",
                      fontWeight: isPlayed ? 700 : 400,
                      color: parColor,
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {hole.par}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                background: isMajor ? m.gold : "var(--pa-bright-yellow)",
                border: `2px solid ${isMajor ? m.gold : "var(--pa-ink)"}`,
                flexShrink: 0,
              }}
            />
            <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 16 }}>
              {holesPlayedPerTournament} holes you'll play by hand · {course.holes.length - holesPlayedPerTournament} simulated from your form
            </div>
          </div>
        </div>

        <div className="pa-section">
          <div className="pa-section-label" style={isMajor ? { color: m.gold } : undefined}>COURSE &amp; CONDITIONS</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              className="pa-panel"
              style={{ flex: 1, textAlign: "center", ...(isMajor ? { background: m.panelBg, border: `2px solid ${m.panelBorder}` } : {}) }}
            >
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>PAR</div>
              <div className="pa-title" style={{ fontSize: 15, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>{course.parTotal}</div>
            </div>
            <div
              className="pa-panel"
              style={{ flex: 1, textAlign: "center", ...(isMajor ? { background: m.panelBg, border: `2px solid ${m.panelBorder}` } : {}) }}
            >
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>DIFFICULTY</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 8 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      border: `2px solid ${isMajor ? m.gold : "var(--pa-ink)"}`,
                      background: i < course.baseDifficulty ? (isMajor ? m.gold : "var(--pa-ink)") : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              className="pa-panel"
              style={{ flex: 1, textAlign: "center", ...(isMajor ? { background: m.panelBg, border: `2px solid ${m.panelBorder}` } : {}) }}
            >
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>WIND</div>
              <div className="pa-title" style={{ fontSize: 15, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>
                {windDirection} {windMph}MPH
              </div>
            </div>
          </div>
        </div>

        <div className="pa-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div className="pa-section-label" style={{ marginBottom: 0, ...(isMajor ? { color: m.gold } : {}) }}>
              THE FIELD
            </div>
            <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>
              {fieldSize} GOLFERS · #{combinedField[0].rank}–#{combinedField[combinedField.length - 1].rank}
            </div>
          </div>
          <div style={{ border: `3px solid ${isMajor ? m.panelBorder : "var(--pa-ink)"}`, background: isMajor ? m.rowBg : "#ffffff" }}>
            {combinedField.map((g) => {
              const isPlayer = g.id === "player";
              return (
                <div
                  key={g.id}
                  className={`pa-row${isPlayer ? " pa-row-player" : ""}`}
                  style={
                    isMajor
                      ? {
                          background: isPlayer ? m.playerRowBg : "transparent",
                          borderTop: isPlayer ? `2px solid ${m.gold}` : "none",
                          borderBottom: `1px solid ${m.panelBorder}`,
                        }
                      : undefined
                  }
                >
                  <div
                    style={{
                      width: 36,
                      fontFamily: "var(--pa-font-body)",
                      color: isMajor ? (isPlayer ? m.cream : m.mutedDark) : isPlayer ? "var(--pa-ink)" : "var(--pa-muted-text)",
                      fontSize: 16,
                    }}
                  >
                    #{g.rank}
                  </div>
                  <div
                    style={{
                      flexGrow: 1,
                      fontFamily: "var(--pa-font-body)",
                      color: isMajor ? (isPlayer ? "#ffffff" : m.cream) : "var(--pa-ink)",
                      fontSize: 18,
                      fontWeight: isPlayer ? "bold" : "normal",
                    }}
                  >
                    {isPlayer ? "You" : g.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pa-font-body)",
                      background: isMajor ? (isPlayer ? m.gold : m.panelBorder) : styleChip[g.style].background,
                      color: isMajor ? (isPlayer ? m.ink : m.cream) : "var(--pa-ink)",
                      fontSize: 13,
                      padding: "2px 6px",
                      border: `1px solid ${isMajor ? m.gold : "var(--pa-ink)"}`,
                    }}
                  >
                    {styleChip[g.style].label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pa-sticky-footer" style={isMajor ? { background: m.screenBg, borderTop: `3px solid ${m.gold}` } : undefined}>
        <button
          className="pa-cta"
          onClick={() => navigate("/gameplay", { state: { prepared, playerId: player.id } })}
          style={
            isMajor
              ? ({
                  background: m.gold,
                  border: `4px solid ${m.gold}`,
                  color: m.ink,
                  ["--pa-shadow-offset" as string]: "6px",
                  ["--pa-shadow-color" as string]: m.ctaShadow,
                } as CSSProperties)
              : undefined
          }
        >
          TEE OFF
        </button>
      </div>
      <FlaticonAttribution />
    </div>
  );
}
