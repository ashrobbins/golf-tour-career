import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { CoinIcon } from "../components/CoinIcon";
import { FlaticonAttribution } from "../components/FlaticonAttribution";
import { SegmentedBar } from "../components/SegmentedBar";
import { usePlayer } from "../hooks/usePlayer";
import { savePlayer } from "../db";
import { canAffordUpgrade, upgradeCost } from "../systems/economy";
import type { Attribute, PlayerProfile } from "../types";

const attributeLabels: Record<Attribute, string> = {
  accuracy: "ACCURACY",
  power: "POWER",
  putting: "PUTTING",
  composure: "COMPOSURE",
};

const attributes: Attribute[] = ["accuracy", "power", "putting", "composure"];

export default function Upgrades() {
  const navigate = useNavigate();
  const { player: fetchedPlayer, loading } = usePlayer();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (fetchedPlayer && !player) setPlayer(fetchedPlayer);
  }, [fetchedPlayer, player]);

  async function handleUpgrade(attr: Attribute) {
    if (!player) return;
    const level = player.attributes[attr];
    const cost = upgradeCost(level);
    if (cost === null || !canAffordUpgrade(player.coins, level)) return;

    const updated: PlayerProfile = {
      ...player,
      coins: player.coins - cost,
      attributes: { ...player.attributes, [attr]: level + 1 },
    };
    setPlayer(updated);
    await savePlayer(updated);
  }

  return (
    <div className="pa-screen">
      <header className="pa-header" style={{ position: "relative", justifyContent: "center" }}>
        <BackButton onClick={() => navigate("/")} style={{ position: "absolute", left: 16 }} />
        <div style={{ textAlign: "center" }}>
          <div className="pa-title">UPGRADES</div>
          {player && (
            <div className="pa-subtitle" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CoinIcon size={16} /> {player.coins.toLocaleString()}
            </div>
          )}
        </div>
      </header>

      <div className="pa-content pa-section" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {loading && <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>Loading...</p>}

        {player &&
          attributes.map((attr) => {
            const level = player.attributes[attr];
            const cost = upgradeCost(level);
            const maxed = cost === null;
            const affordable = !maxed && canAffordUpgrade(player.coins, level);

            return (
              <div key={attr} className="pa-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 18 }}>
                    {attributeLabels[attr]}
                  </div>
                  <div style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)", fontSize: 18 }}>
                    {level} / 10
                  </div>
                </div>

                <SegmentedBar value={level} />

                <button
                  className="pa-cta"
                  style={{
                    fontSize: 14,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  disabled={!affordable}
                  onClick={() => handleUpgrade(attr)}
                >
                  {maxed ? (
                    "MAXED"
                  ) : (
                    <>
                      UPGRADE ·<CoinIcon size={14} /> {cost.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            );
          })}
      </div>

      <FlaticonAttribution />
    </div>
  );
}
