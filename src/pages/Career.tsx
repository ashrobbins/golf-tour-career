import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { CoinIcon } from "../components/CoinIcon";
import { FlaticonAttribution } from "../components/FlaticonAttribution";
import { GolferAvatar } from "../components/GolferAvatar";
import { TrophyIcon } from "../components/TrophyIcon";
import { usePlayer } from "../hooks/usePlayer";
import { getAllTournamentHistory } from "../db";
import { resetCareer } from "../systems/init";
import { rankingConfig, seasonConfig } from "../config/balance";
import type { TournamentHistoryEntry } from "../types";
import forwardIcon from "../assets/forward-icon.png";

const milestones = [500, 300, 100, 50, 10, 1];

/** Scales the earnings figure down as it grows more digits, so a 7- or
 *  8-figure career total (plus its thousands commas) still fits the box. */
function earningsFontSize(value: number): number {
  const digits = value <= 0 ? 1 : Math.floor(Math.log10(value)) + 1;
  if (digits <= 4) return 22;
  if (digits === 5) return 19;
  if (digits === 6) return 17;
  if (digits === 7) return 15;
  return 13;
}

function nextMilestone(rank: number): number | null {
  for (const m of milestones) {
    if (rank > m) return m;
  }
  return null;
}

function RankHistoryChart({ history }: { history: TournamentHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 15 }}>
        Play tournaments to start building your rank history.
      </p>
    );
  }

  const values = [rankingConfig.startingRank, ...history.map((h) => h.rankAfter)];
  const minRank = Math.min(...values);
  const maxRank = Math.max(...values);
  const spread = Math.max(1, maxRank - minRank);

  const width = 300;
  const height = 90;
  const pad = 8;

  const points = values.map((rank, i) => {
    const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - pad * 2) + pad;
    const y = pad + ((rank - minRank) / spread) * (height - pad * 2);
    return `${x},${y}`;
  });

  const last = points[points.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <polyline points={points.join(" ")} fill="none" stroke="var(--pa-ink)" strokeWidth={3} />
      <circle cx={last[0]} cy={last[1]} r={5} fill="var(--pa-coral)" stroke="var(--pa-ink)" strokeWidth={2} />
    </svg>
  );
}

export default function Career() {
  const navigate = useNavigate();
  const { player, loading } = usePlayer();
  const [history, setHistory] = useState<TournamentHistoryEntry[] | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    getAllTournamentHistory().then((entries) => {
      entries.sort((a, b) => a.season - b.season || a.number - b.number);
      setHistory(entries);
    });
  }, []);

  async function handleConfirmReset() {
    if (!player || resetting) return;
    setResetting(true);
    await resetCareer(player);
    navigate("/", { replace: true });
  }

  if (loading || !player) {
    return (
      <div className="pa-screen">
        <header className="pa-header" style={{ justifyContent: "center" }}>
          <div className="pa-title">CAREER</div>
        </header>
        <div className="pa-content pa-section">
          {loading && <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>Loading...</p>}
        </div>
      </div>
    );
  }

  const seasonDelta = player.seasonStartRank - player.rank;
  const goal = nextMilestone(player.rank);
  const start = rankingConfig.startingRank;
  const progress = goal === null ? 10 : Math.min(10, Math.max(0, Math.round(((start - player.rank) / (start - goal)) * 10)));
  const isQualified = player.majorQualifiedForSeason === player.season;

  return (
    <div className="pa-screen">
      <header className="pa-header" style={{ position: "relative", justifyContent: "center" }}>
        <BackButton onClick={() => navigate("/")} style={{ position: "absolute", left: 16 }} />
        <div className="pa-title">CAREER</div>
      </header>

      <div className="pa-content pa-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 16 }}>
            WORLD RANKING
          </div>
          <div className="pa-title" style={{ fontSize: 40, marginTop: 8, color: "var(--pa-ink)" }}>
            #{player.rank}
          </div>
          {seasonDelta !== 0 && (
            <div
              style={{
                fontFamily: "var(--pa-font-body)",
                fontSize: 18,
                marginTop: 6,
                color: seasonDelta > 0 ? "var(--pa-blue-text)" : "var(--pa-coral)",
              }}
            >
              {seasonDelta > 0 ? "▲" : "▼"} {seasonDelta > 0 ? "UP" : "DOWN"} {Math.abs(seasonDelta)} THIS SEASON
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div className="pa-section-label" style={{ marginBottom: 0 }}>
              NEXT MILESTONE
            </div>
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 15 }}>
              {goal === null ? "MAX RANK" : `TOP ${goal}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 14,
                  border: "2px solid var(--pa-ink)",
                  background: i < progress ? "var(--pa-ink)" : "var(--pa-cream-mid)",
                }}
              />
            ))}
          </div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 13, marginTop: 6 }}>
            #{start} START · #{player.rank} NOW · {goal === null ? "#1 GOAL" : `#${goal} GOAL`}
          </div>
        </div>

        {isQualified ? (
          <div
            style={{
              background: "var(--pa-bright-yellow)",
              border: "3px solid var(--pa-ink)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22 }}>★</div>
            <div>
              <div className="pa-title" style={{ fontSize: 14, color: "var(--pa-ink)" }}>
                MAJOR QUALIFIED
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 14, marginTop: 4 }}>
                LOCKED IN FOR ALL SEASON {player.season} MAJORS
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "var(--pa-parchment)",
              border: "3px solid var(--pa-ink)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, color: "var(--pa-muted-text)" }}>★</div>
            <div>
              <div className="pa-title" style={{ fontSize: 14, color: "var(--pa-ink)" }}>
                NOT YET QUALIFIED
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14, marginTop: 4 }}>
                FINISH SEASON {player.season} TOP {seasonConfig.majorQualificationRank} FOR SEASON {player.season + 1} MAJORS
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="pa-section-label">CAREER STATS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="pa-panel">
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14 }}>WINS</div>
              <div className="pa-title" style={{ fontSize: 22, marginTop: 6, color: "var(--pa-ink)" }}>
                {player.careerStats.wins}
              </div>
            </div>
            <div className="pa-panel">
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14 }}>PODIUMS</div>
              <div className="pa-title" style={{ fontSize: 22, marginTop: 6, color: "var(--pa-ink)" }}>
                {player.careerStats.podiums}
              </div>
            </div>
            <div className="pa-panel" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14 }}>EARNINGS</div>
              <div
                className="pa-title"
                style={{
                  fontSize: earningsFontSize(player.careerStats.careerEarnings),
                  marginTop: 6,
                  color: "var(--pa-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CoinIcon size={18} /> {player.careerStats.careerEarnings.toLocaleString()}
              </div>
            </div>
            <div className="pa-panel">
              <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14 }}>HIGHEST</div>
              <div className="pa-title" style={{ fontSize: 22, marginTop: 6, color: "var(--pa-ink)" }}>
                #{player.careerStats.highestRank}
              </div>
            </div>
          </div>
        </div>

        <button
          className="pa-panel"
          onClick={() => navigate("/trophy-cabinet")}
          style={{
            all: "unset",
            boxSizing: "border-box",
            cursor: "pointer",
            background: "#ffffff",
            border: "3px solid var(--pa-ink)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TrophyIcon size={40} />
          <div style={{ flexGrow: 1 }}>
            <div className="pa-title" style={{ fontSize: 14, color: "var(--pa-ink)" }}>
              MAJOR TROPHY CABINET
            </div>
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14, marginTop: 4 }}>
              {player.careerStats.majorWins} major{player.careerStats.majorWins === 1 ? "" : "s"} won
            </div>
          </div>
          <img src={forwardIcon} alt="" style={{ height: 16, width: "auto", imageRendering: "pixelated" }} />
        </button>

        <div>
          <div className="pa-section-label">RANK HISTORY</div>
          <div className="pa-panel">{history === null ? null : <RankHistoryChart history={history} />}</div>
        </div>

        <button
          className="pa-panel"
          onClick={() => navigate("/golfer-editor")}
          style={{
            all: "unset",
            boxSizing: "border-box",
            cursor: "pointer",
            background: "#ffffff",
            border: "3px solid var(--pa-ink)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <GolferAvatar appearance={player.appearance} size={56} />
          <div style={{ flexGrow: 1 }}>
            <div className="pa-title" style={{ fontSize: 14, color: "var(--pa-ink)" }}>
              EDIT GOLFER
            </div>
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 14, marginTop: 4 }}>
              Name, appearance & colours
            </div>
          </div>
          <img src={forwardIcon} alt="" style={{ height: 16, width: "auto", imageRendering: "pixelated" }} />
        </button>

        <button
          className="pa-cta"
          onClick={() => setConfirmingReset(true)}
          style={{ background: "var(--pa-coral)", boxShadow: "6px 6px 0 var(--pa-ink)" }}
        >
          RESET CAREER
        </button>
      </div>
      <FlaticonAttribution />

      {confirmingReset && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20, 37, 26, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 10,
          }}
        >
          <div
            className="pa-panel"
            style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, background: "#ffffff" }}
          >
            <div className="pa-title" style={{ fontSize: 16, color: "var(--pa-coral)" }}>
              RESET CAREER?
            </div>
            <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 16, lineHeight: 1.4 }}>
              This wipes your rank, coins, career stats and tournament history for good, and resets your golfer's
              colours to their defaults. This can't be undone.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                className="pa-cta"
                disabled={resetting}
                onClick={() => setConfirmingReset(false)}
                style={{ flex: 1, fontSize: 12, padding: 12, background: "var(--pa-muted-text)", boxShadow: "4px 4px 0 var(--pa-ink)" }}
              >
                CANCEL
              </button>
              <button
                className="pa-cta"
                disabled={resetting}
                onClick={handleConfirmReset}
                style={{ flex: 1, fontSize: 12, padding: 12, background: "var(--pa-coral)", boxShadow: "4px 4px 0 var(--pa-ink)" }}
              >
                {resetting ? "..." : "RESET"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
