import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CoinIcon } from "../components/CoinIcon";
import { GolferHeadshot } from "../components/GolferHeadshot";
import { usePlayer } from "../hooks/usePlayer";
import { addTournamentHistory, savePlayer } from "../db";
import { tournamentName } from "../data/tournamentNames";
import { computeEarnings } from "../systems/economy";
import { computeRankingChange } from "../systems/ranking";
import { nextTournamentNumber, qualifiesForNextSeasonMajors } from "../systems/season";
import { buildFinalStandings, type PreparedTournament } from "../systems/tournament";
import { ordinal } from "../utils/format";
import { majorTheme } from "../styles/majorTheme";
import type { PlayerProfile } from "../types";

interface PlayedHoleResult {
  holeNumber: number;
  par: number;
  scoreToPar: number;
}

interface ResultsState {
  prepared: PreparedTournament;
  totalScoreToPar: number;
  playedHoles: PlayedHoleResult[];
  simulatedHolesCount: number;
}

interface AppliedResult {
  position: number;
  positionLabel: string;
  fieldSize: number;
  oldRank: number;
  newRank: number;
  rankDelta: number;
  earnings: number;
}

function scoreText(scoreToPar: number): string {
  if (scoreToPar === 0) return "E";
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

function holeScoreColor(scoreToPar: number): string {
  if (scoreToPar < 0) return "#1f7a3d";
  if (scoreToPar > 0) return "#c1362b";
  return "var(--pa-ink)";
}

function majorHoleScoreColor(scoreToPar: number): string {
  if (scoreToPar < 0) return majorTheme.underPar;
  if (scoreToPar > 0) return majorTheme.overPar;
  return majorTheme.cream;
}

export default function TournamentResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { player } = usePlayer();
  const state = (location.state as { results?: ResultsState } | null)?.results ?? null;
  const appliedRef = useRef(false);
  const [applied, setApplied] = useState<AppliedResult | null>(null);

  const standings = useMemo(() => {
    if (!state || !player) return null;
    return buildFinalStandings(state.prepared.tournament.id, state.prepared.course, state.prepared.field, {
      rank: player.rank,
      scoreToPar: state.totalScoreToPar,
    });
  }, [state, player]);

  useEffect(() => {
    if (!state || !player || !standings || appliedRef.current) return;
    appliedRef.current = true;

    const playerStanding = standings.find((s) => s.isPlayer)!;
    const opponentRanks = state.prepared.field.map((g) => g.rank);
    const fieldSize = state.prepared.field.length + 1;

    const rankingResult = computeRankingChange({
      playerRank: player.rank,
      opponentRanks,
      finishPosition: playerStanding.position,
      fieldSize,
      tournamentType: state.prepared.tournament.type,
    });
    const earnings = computeEarnings({
      playerRank: player.rank,
      finishPosition: playerStanding.position,
      tournamentType: state.prepared.tournament.type,
    });
    const positionCounts = new Map<number, number>();
    standings.forEach((s) => positionCounts.set(s.position, (positionCounts.get(s.position) ?? 0) + 1));
    const tied = (positionCounts.get(playerStanding.position) ?? 0) > 1;

    const isMajor = state.prepared.tournament.type === "major";
    const { number: newTournamentNumber, rolledOver } = nextTournamentNumber(player.tournamentNumber);

    const updatedPlayer: PlayerProfile = {
      ...player,
      rank: rankingResult.newRank,
      coins: player.coins + earnings,
      tournamentNumber: newTournamentNumber,
      season: rolledOver ? player.season + 1 : player.season,
      seasonStartRank: rolledOver ? rankingResult.newRank : player.seasonStartRank,
      majorQualifiedForSeason: rolledOver
        ? qualifiesForNextSeasonMajors(rankingResult.newRank)
          ? player.season + 1
          : null
        : player.majorQualifiedForSeason,
      careerStats: {
        ...player.careerStats,
        tournamentsPlayed: player.careerStats.tournamentsPlayed + 1,
        wins: player.careerStats.wins + (playerStanding.position === 1 ? 1 : 0),
        podiums: player.careerStats.podiums + (playerStanding.position <= 3 ? 1 : 0),
        top10s: player.careerStats.top10s + (playerStanding.position <= 10 ? 1 : 0),
        majorAppearances: player.careerStats.majorAppearances + (isMajor ? 1 : 0),
        majorWins: player.careerStats.majorWins + (isMajor && playerStanding.position === 1 ? 1 : 0),
        careerEarnings: player.careerStats.careerEarnings + earnings,
        highestRank: Math.min(player.careerStats.highestRank, rankingResult.newRank),
      },
    };

    savePlayer(updatedPlayer);
    addTournamentHistory({
      tournamentId: state.prepared.tournament.id,
      season: player.season,
      number: player.tournamentNumber,
      type: state.prepared.tournament.type,
      courseTemplateId: state.prepared.course.id,
      finishPosition: playerStanding.position,
      fieldSize,
      scoreToPar: state.totalScoreToPar,
      playedHoles: state.playedHoles.map((h) => ({ ...h, decision: "played" })),
      rankBefore: player.rank,
      rankAfter: rankingResult.newRank,
      earnings,
    });

    setApplied({
      position: playerStanding.position,
      positionLabel: `${tied ? "T-" : ""}${ordinal(playerStanding.position)}`,
      fieldSize,
      oldRank: player.rank,
      newRank: rankingResult.newRank,
      rankDelta: rankingResult.rankDelta,
      earnings,
    });
  }, [state, player, standings]);

  if (!state || !player || !standings || !applied) {
    return (
      <div className="pa-screen">
        <div className="pa-content pa-section">
          <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>Tallying up the round...</p>
        </div>
      </div>
    );
  }

  const name = tournamentName(state.prepared.tournament.id, state.prepared.tournament.type);
  const isMajor = state.prepared.tournament.type === "major";
  const m = majorTheme;

  return (
    <div
      className="pa-screen"
      style={isMajor ? { background: m.screenBg, border: `4px solid ${m.screenBorder}` } : undefined}
    >
      <header className="pa-header" style={isMajor ? { background: m.headerBg, borderBottom: `3px solid ${m.gold}`, justifyContent: "center" } : { justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="pa-title" style={isMajor ? { color: m.gold } : undefined}>TOURNAMENT COMPLETE</div>
          <div className="pa-subtitle" style={isMajor ? { color: m.muted } : undefined}>
            {name.toUpperCase()} · FINAL
          </div>
        </div>
      </header>

      <div
        className="pa-content pa-section"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, flexGrow: 1 }}
      >
        {player && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GolferHeadshot appearance={player.appearance} size={140} />
          </div>
        )}

        <div
          className="pa-panel"
          style={{ display: "flex", flexDirection: "column", gap: 10, ...(isMajor ? { background: m.rowBg, border: `3px solid ${m.gold}` } : {}) }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>
                YOU FINISHED
              </div>
              <div className="pa-title" style={{ fontSize: 18, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>
                {applied.positionLabel}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>SCORE</div>
              <div className="pa-title" style={{ fontSize: 18, marginTop: 4, color: isMajor ? m.cream : "var(--pa-ink)" }}>
                {scoreText(state.totalScoreToPar)}
              </div>
            </div>
          </div>

          <div style={{ borderTop: `2px solid ${isMajor ? m.panelBorder : "var(--pa-ink)"}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 20 }}>
                WORLD RANK
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-ink)", fontSize: 20 }}>
                #{applied.oldRank} → #{applied.newRank}{" "}
                {applied.rankDelta > 0 && <span style={{ color: isMajor ? m.underPar : "#1f7a3d" }}>▲{applied.rankDelta}</span>}
                {applied.rankDelta < 0 && <span style={{ color: isMajor ? m.overPar : "#c1362b" }}>▼{Math.abs(applied.rankDelta)}</span>}
                {applied.rankDelta === 0 && <span style={{ color: isMajor ? m.mutedDark : "var(--pa-muted-text)" }}>—</span>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 20 }}>
                EARNINGS
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-ink)", fontSize: 20, display: "flex", alignItems: "center", gap: 6 }}>
                <CoinIcon size={20} /> +{applied.earnings}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15, marginBottom: 6 }}>
            HOLES YOU PLAYED
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {state.playedHoles.map((hole) => {
              const best = Math.min(...state.playedHoles.map((h) => h.scoreToPar));
              const highlight = hole.scoreToPar === best && best < 0;
              return (
                <div
                  key={hole.holeNumber}
                  style={{
                    border: `3px solid ${isMajor ? (highlight ? m.gold : m.panelBorder) : "var(--pa-ink)"}`,
                    background: isMajor ? (highlight ? m.playerRowBg : m.rowBg) : highlight ? "#f4e9c1" : "#ffffff",
                    padding: "8px 4px",
                    textAlign: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 13 }}>
                    H{hole.holeNumber} · P{hole.par}
                  </div>
                  <div
                    className="pa-title"
                    style={{ fontSize: 16, marginTop: 2, color: isMajor ? majorHoleScoreColor(hole.scoreToPar) : holeScoreColor(hole.scoreToPar) }}
                  >
                    {scoreText(hole.scoreToPar)}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 14, marginTop: 8 }}>
            The other {state.simulatedHolesCount} holes were simulated from your attributes and how these {state.playedHoles.length} decisions played out.
          </p>
        </div>
      </div>

      <div className="pa-sticky-footer" style={isMajor ? { background: m.screenBg, borderTop: `3px solid ${m.gold}` } : undefined}>
        <button
          className="pa-cta"
          onClick={() => navigate("/", { replace: true })}
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
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
