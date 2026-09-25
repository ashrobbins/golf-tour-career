import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { CoinIcon } from "../components/CoinIcon";
import { FlaticonAttribution } from "../components/FlaticonAttribution";
import { GolferHeadshot } from "../components/GolferHeadshot";
import { SegmentedBar } from "../components/SegmentedBar";
import { usePlayer } from "../hooks/usePlayer";
import { seasonConfig } from "../config/balance";
import { tournamentName } from "../data/tournamentNames";
import { prepareTournament } from "../systems/tournament";
import type { TournamentType } from "../types";
import upgradeIcon from "../assets/upgrade-icon.png";
import careerIcon from "../assets/career-icon.png";

interface UpNext {
  name: string;
  type: TournamentType;
  fieldSize: number;
  rankMin: number;
  rankMax: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { player, loading, error } = usePlayer();
  const [upNext, setUpNext] = useState<UpNext | null>(null);

  useEffect(() => {
    if (!loading && !player) navigate("/golfer-editor", { replace: true });
  }, [loading, player, navigate]);

  useEffect(() => {
    if (!player) return;
    let cancelled = false;
    prepareTournament(player).then((prepared) => {
      if (cancelled) return;
      const ranks = [player.rank, ...prepared.field.map((g) => g.rank)];
      setUpNext({
        name: tournamentName(prepared.tournament.id, prepared.tournament.type),
        type: prepared.tournament.type,
        fieldSize: prepared.field.length + 1,
        rankMin: Math.min(...ranks),
        rankMax: Math.max(...ranks),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [player]);

  const rankDelta = player ? player.seasonStartRank - player.rank : 0;
  const isQualifiedThisSeason = player ? player.majorQualifiedForSeason === player.season : false;

  return (
    <div className="pa-screen">
      <header className="pa-header" style={{ gap: 12 }}>
        {player && <GolferHeadshot appearance={player.appearance} size={52} />}
        <div>
          <div className="pa-title" style={{ fontSize: 16, textAlign: "left" }}>
            {loading ? "LOADING..." : error ? "ERROR" : player?.name.toUpperCase()}
          </div>
          {player && (
            <div className="pa-subtitle" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 18 }}>
              WORLD RANK #{player.rank}
              {rankDelta > 0 && <span style={{ color: "#8fd694" }}>▲{rankDelta}</span>}
              {rankDelta < 0 && <span style={{ color: "var(--pa-coral)" }}>▼{Math.abs(rankDelta)}</span>}
            </div>
          )}
        </div>
        {player && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <CoinIcon size={22} />
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-parchment)", fontSize: 23, fontWeight: 700 }}>
              {player.coins.toLocaleString()}
            </div>
          </div>
        )}
      </header>

      <div className="pa-content pa-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {error && <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-coral)" }}>{error}</p>}

        {player && (
          <>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div className="pa-section-label" style={{ marginBottom: 0 }}>
                  SEASON {player.season}
                </div>
                <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 15 }}>
                  TOURNAMENT {player.tournamentNumber} OF {seasonConfig.tournamentsPerSeason}
                </div>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: seasonConfig.tournamentsPerSeason }, (_, i) => i + 1).map((n) => {
                  const isMajor = (seasonConfig.majorSlots as readonly number[]).includes(n);
                  const isPast = n < player.tournamentNumber;
                  const isCurrent = n === player.tournamentNumber;
                  return (
                    <div
                      key={n}
                      style={{
                        flex: 1,
                        height: 14,
                        border: isCurrent ? "2px solid var(--pa-ink)" : "1px solid var(--pa-ink)",
                        background: isMajor
                          ? "var(--pa-bright-yellow)"
                          : isPast || isCurrent
                            ? "var(--pa-green)"
                            : "var(--pa-cream-mid)",
                      }}
                    />
                  );
                })}
              </div>
              {isQualifiedThisSeason && (
                <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 13, marginTop: 6 }}>
                  QUALIFIED FOR SEASON {player.season} MAJORS
                </div>
              )}
            </div>

            <div>
              <div className="pa-section-label">UP NEXT</div>
              <div
                className="pa-panel"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflow: "hidden",
                  padding: "16px 14px",
                }}
              >
                <div style={{ position: "relative", textAlign: "center" }}>
                  <div className="pa-title" style={{ fontSize: 16, color: "var(--pa-ink)" }}>
                    {upNext ? upNext.name.toUpperCase() : "PREPARING..."}
                  </div>
                  {upNext?.type === "major" && (
                    <div
                      className="pa-chip"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 0,
                        transform: "translateY(-50%)",
                        background: "var(--pa-bright-yellow)",
                        color: "var(--pa-amber-text)",
                      }}
                    >
                      MAJOR
                    </div>
                  )}
                </div>
                {upNext && (
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 15 }}>
                    {upNext.type === "major" ? "MAJOR" : "REGULAR"} · {upNext.fieldSize} GOLFERS
                    <br />
                    FIELD #{upNext.rankMin}–#{upNext.rankMax}
                  </div>
                )}
                <button
                  className="pa-cta"
                  style={{ fontSize: 15, padding: 14, marginTop: 4 }}
                  disabled={!upNext}
                  onClick={() => navigate("/course-preview")}
                >
                  TEE OFF
                </button>

                {upNext?.type === "major" && !isQualifiedThisSeason && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        border: "4px double #c1362b",
                        color: "#c1362b",
                        fontFamily: "var(--pa-font-title)",
                        fontSize: 18,
                        padding: "8px 14px",
                        transform: "rotate(-9deg)",
                        letterSpacing: 2,
                        background: "rgba(244, 233, 193, 0.85)",
                      }}
                    >
                      NOT QUALIFIED
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="pa-section-label">CAREER STATS</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="pa-panel" style={{ flex: 1, textAlign: "center" }}>
                  <div className="pa-title" style={{ fontSize: 20, color: "var(--pa-ink)" }}>{player.careerStats.wins}</div>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 13, marginTop: 4 }}>
                    WINS
                  </div>
                </div>
                <div className="pa-panel" style={{ flex: 1, textAlign: "center" }}>
                  <div className="pa-title" style={{ fontSize: 20, color: "var(--pa-ink)" }}>{player.careerStats.podiums}</div>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 13, marginTop: 4 }}>
                    TOP 3 FINISHES
                  </div>
                </div>
                <div className="pa-panel" style={{ flex: 1, textAlign: "center" }}>
                  <div className="pa-title" style={{ fontSize: 20, color: "var(--pa-ink)" }}>{player.careerStats.majorWins}</div>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 13, marginTop: 4 }}>
                    MAJORS
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="pa-section-label">ATTRIBUTES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(["accuracy", "power", "putting", "composure"] as const).map((attr) => (
                  <div key={attr}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 15, textTransform: "uppercase" }}>
                        {attr}
                      </div>
                      <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 15 }}>
                        {player.attributes[attr]} / 10
                      </div>
                    </div>
                    <SegmentedBar value={player.attributes[attr]} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {player && (
        <div className="pa-sticky-footer" style={{ display: "flex", gap: 8, padding: "12px 16px 16px 16px" }}>
          <button
            className="pa-option-card"
            onClick={() => navigate("/upgrades")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 6px",
              ["--pa-shadow-offset" as string]: "3px",
              background: "var(--pa-coral-soft)",
            } as CSSProperties}
          >
            <img src={upgradeIcon} alt="" style={{ height: 13, width: "auto", imageRendering: "pixelated" }} />
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 15, fontWeight: 700, marginTop: -2 }}>
              UPGRADES
            </div>
          </button>
          <button
            className="pa-option-card"
            onClick={() => navigate("/career")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 6px",
              ["--pa-shadow-offset" as string]: "3px",
              background: "var(--pa-blue)",
            } as CSSProperties}
          >
            <img src={careerIcon} alt="" style={{ height: 13, width: "auto", imageRendering: "pixelated" }} />
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 15, fontWeight: 700, marginTop: -2 }}>
              CAREER
            </div>
          </button>
        </div>
      )}
      {player && <FlaticonAttribution />}
    </div>
  );
}
