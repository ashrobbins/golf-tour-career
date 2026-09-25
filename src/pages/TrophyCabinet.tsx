import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { TrophyIcon } from "../components/TrophyIcon";
import { getAllTournamentHistory } from "../db";
import { tournamentName } from "../data/tournamentNames";
import type { TournamentHistoryEntry } from "../types";

export default function TrophyCabinet() {
  const navigate = useNavigate();
  const [wins, setWins] = useState<TournamentHistoryEntry[] | null>(null);

  useEffect(() => {
    getAllTournamentHistory().then((entries) => {
      const majorWins = entries
        .filter((e) => e.type === "major" && e.finishPosition === 1)
        .sort((a, b) => a.season - b.season || a.number - b.number);
      setWins(majorWins);
    });
  }, []);

  return (
    <div className="pa-screen">
      <header className="pa-header" style={{ position: "relative", justifyContent: "center" }}>
        <BackButton onClick={() => navigate("/career")} style={{ position: "absolute", left: 16 }} />
        <div className="pa-title">MAJOR TROPHY CABINET</div>
      </header>

      <div className="pa-content pa-section">
        {wins === null ? null : wins.length === 0 ? (
          <div
            style={{
              border: "3px dashed var(--pa-muted-text)",
              background: "var(--pa-cream-mid)",
              padding: "28px 20px",
              textAlign: "center",
            }}
          >
            <TrophyIcon size={56} grayscale />
            <div
              style={{
                fontFamily: "var(--pa-font-body)",
                color: "var(--pa-muted-text)",
                fontSize: 19,
                marginTop: 14,
                lineHeight: 1.35,
              }}
            >
              Gathering dust in here — pull your finger out and start winning!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {wins.map((win) => (
              <div
                key={win.tournamentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 12px",
                  background: "#ffffff",
                  border: "3px solid var(--pa-ink)",
                }}
              >
                <TrophyIcon size={38} />
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div className="pa-title" style={{ fontSize: 11, color: "var(--pa-ink)", lineHeight: 1.4 }}>
                    {tournamentName(win.tournamentId, win.type).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-muted-text)", fontSize: 15, marginTop: 3 }}>
                    SEASON {win.season}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
