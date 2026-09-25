import { useMemo, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tournamentName } from "../data/tournamentNames";
import { buildFinalStandings, type PreparedTournament } from "../systems/tournament";
import { ordinal } from "../utils/format";
import { majorTheme } from "../styles/majorTheme";

interface PlayedHoleResult {
  holeNumber: number;
  par: number;
  scoreToPar: number;
}

interface LeaderboardState {
  prepared: PreparedTournament;
  playerRank: number;
  playerScoreToPar: number;
  playedHoles: PlayedHoleResult[];
  simulatedHolesCount: number;
}

function scoreText(scoreToPar: number): string {
  if (scoreToPar === 0) return "E";
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

export default function TournamentLeaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { leaderboard?: LeaderboardState } | null)?.leaderboard ?? null;

  const standings = useMemo(() => {
    if (!state) return null;
    return buildFinalStandings(state.prepared.tournament.id, state.prepared.course, state.prepared.field, {
      rank: state.playerRank,
      scoreToPar: state.playerScoreToPar,
    });
  }, [state]);

  if (!state || !standings) {
    return (
      <div className="pa-screen">
        <div className="pa-content pa-section">
          <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>No finished round to show.</p>
          <button className="pa-cta" style={{ marginTop: 12 }} onClick={() => navigate("/")}>
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  const isMajor = state.prepared.tournament.type === "major";
  const m = majorTheme;
  const name = tournamentName(state.prepared.tournament.id, state.prepared.tournament.type);
  const playerStanding = standings.find((s) => s.isPlayer)!;

  const positionCounts = new Map<number, number>();
  standings.forEach((s) => positionCounts.set(s.position, (positionCounts.get(s.position) ?? 0) + 1));
  const positionLabel = (position: number) => {
    const tied = (positionCounts.get(position) ?? 0) > 1;
    return `${tied ? "T-" : ""}${ordinal(position)}`;
  };

  return (
    <div
      className="pa-screen"
      style={isMajor ? { background: m.screenBg, border: `4px solid ${m.screenBorder}` } : undefined}
    >
      <header
        className="pa-header"
        style={isMajor ? { background: m.headerBg, borderBottom: `3px solid ${m.gold}`, justifyContent: "center" } : { justifyContent: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="pa-title" style={isMajor ? { color: m.gold } : undefined}>{name.toUpperCase()}</div>
          <div className="pa-subtitle" style={isMajor ? { color: m.muted } : undefined}>FINAL RESULTS</div>
        </div>
      </header>

      <div className="pa-content">
        <div className="pa-section" style={{ paddingBottom: 8 }}>
          <div
            className="pa-panel"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              ...(isMajor ? { background: m.rowBg, border: `3px solid ${m.gold}` } : {}),
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>
                YOU FINISHED
              </div>
              <div className="pa-title" style={{ fontSize: 18, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>
                {positionLabel(playerStanding.position)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>SCORE</div>
              <div className="pa-title" style={{ fontSize: 18, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>
                {scoreText(playerStanding.scoreToPar)}
              </div>
            </div>
          </div>
        </div>

        <div className="pa-section">
          <div style={{ display: "flex", padding: "0 0 8px 0" }}>
            <div style={{ width: 56, fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>POS</div>
            <div style={{ flexGrow: 1, fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>
              GOLFER
            </div>
            <div style={{ width: 70, fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15, textAlign: "right" }}>
              SCORE
            </div>
          </div>

          <div style={{ border: `3px solid ${isMajor ? m.panelBorder : "var(--pa-ink)"}`, background: isMajor ? m.rowBg : "#ffffff" }}>
            {standings.map((entry) => (
              <div
                key={entry.id}
                className={`pa-row${entry.isPlayer ? " pa-row-player" : ""}`}
                style={
                  isMajor
                    ? {
                        background: entry.isPlayer ? m.playerRowBg : "transparent",
                        borderTop: entry.isPlayer ? `2px solid ${m.gold}` : "none",
                        borderBottom: `1px solid ${m.panelBorder}`,
                      }
                    : undefined
                }
              >
                <div
                  style={{
                    width: 56,
                    fontFamily: "var(--pa-font-body)",
                    fontSize: 14,
                    color: isMajor ? (entry.isPlayer ? m.cream : m.mutedDark) : entry.isPlayer ? "var(--pa-ink)" : "var(--pa-muted-text)",
                  }}
                >
                  {positionLabel(entry.position)}
                </div>
                <div
                  style={{
                    flexGrow: 1,
                    fontFamily: "var(--pa-font-body)",
                    color: isMajor ? (entry.isPlayer ? "#ffffff" : m.cream) : "var(--pa-ink)",
                    fontSize: 18,
                    fontWeight: entry.isPlayer ? "bold" : "normal",
                  }}
                >
                  {entry.name}
                </div>
                <div
                  style={{
                    width: 50,
                    fontFamily: "var(--pa-font-body)",
                    fontSize: 16,
                    color: isMajor ? m.cream : "var(--pa-ink)",
                    textAlign: "right",
                  }}
                >
                  {scoreText(entry.scoreToPar)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 4 }} />
      </div>

      <div className="pa-sticky-footer" style={isMajor ? { background: m.screenBg, borderTop: `3px solid ${m.gold}` } : undefined}>
        <button
          className="pa-cta"
          onClick={() =>
            navigate("/results", {
              replace: true,
              state: {
                results: {
                  prepared: state.prepared,
                  totalScoreToPar: state.playerScoreToPar,
                  playedHoles: state.playedHoles,
                  simulatedHolesCount: state.simulatedHolesCount,
                },
              },
            })
          }
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
          VIEW RESULTS
        </button>
      </div>
    </div>
  );
}
