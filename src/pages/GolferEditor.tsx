import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { FlaticonAttribution } from "../components/FlaticonAttribution";
import { GolferAvatar } from "../components/GolferAvatar";
import { hatColors, shirtColors, skinTones } from "../data/appearancePalette";
import { usePlayer } from "../hooks/usePlayer";
import { savePlayer } from "../db";
import { createPlayer, defaultPlayerProfile } from "../systems/init";
import type { Appearance } from "../types";
import { hexToHsl } from "../utils/color";
import checkIconLight from "../assets/check-icon.png";
import checkIconDark from "../assets/check-icon-dark.png";

function Swatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [, , lightness] = hexToHsl(color);
  const isDarkSwatch = lightness < 0.55;

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        boxSizing: "border-box",
        cursor: "pointer",
        width: "100%",
        aspectRatio: "1",
        background: color,
        border: selected ? "3px solid var(--pa-bright-yellow)" : "2px solid var(--pa-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected && (
        <img
          src={isDarkSwatch ? checkIconLight : checkIconDark}
          alt="Selected"
          style={{
            width: "27%",
            height: "auto",
            imageRendering: "pixelated",
            filter: isDarkSwatch
              ? "drop-shadow(1px 1px 0 rgba(0,0,0,0.6))"
              : "drop-shadow(1px 1px 0 rgba(255,255,255,0.6))",
          }}
        />
      )}
    </button>
  );
}

export default function GolferEditor() {
  const navigate = useNavigate();
  const { player, loading } = usePlayer();
  const isEdit = !!player;

  const fallback = defaultPlayerProfile();
  const [name, setName] = useState(fallback.name === "New Golfer" ? "" : fallback.name);
  const [skinTone, setSkinTone] = useState(fallback.appearance.skinTone);
  const [hatColor, setHatColor] = useState(fallback.appearance.hatColor);
  const [shirtColor, setShirtColor] = useState(fallback.appearance.shirtColor);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!player || hydrated) return;
    setName(player.name);
    setSkinTone(player.appearance.skinTone);
    setHatColor(player.appearance.hatColor);
    setShirtColor(player.appearance.shirtColor);
    setHydrated(true);
  }, [player, hydrated]);

  if (loading) {
    return (
      <div className="pa-screen">
        <div className="pa-content pa-section">
          <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const previewAppearance: Pick<Appearance, "skinTone" | "hatColor" | "shirtColor"> = {
    skinTone,
    hatColor,
    shirtColor,
  };

  const canSubmit = name.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (isEdit && player) {
      await savePlayer({
        ...player,
        name: name.trim(),
        appearance: { ...player.appearance, skinTone, hatColor, shirtColor },
      });
      navigate("/career", { replace: true });
    } else {
      await createPlayer({
        name: name.trim(),
        appearance: { ...fallback.appearance, skinTone, hatColor, shirtColor },
      });
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="pa-screen">
      <header className="pa-header" style={{ justifyContent: "center", position: "relative" }}>
        {isEdit && <BackButton onClick={() => navigate("/career")} style={{ position: "absolute", left: 16 }} />}
        <div style={{ textAlign: "center" }}>
          <div className="pa-title">{isEdit ? "EDIT YOUR GOLFER" : "CREATE YOUR GOLFER"}</div>
          <div className="pa-subtitle">WORLD RANK #{isEdit && player ? player.rank : fallback.rank}</div>
        </div>
      </header>

      <div className="pa-content pa-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          className="pa-panel"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "var(--pa-cream-light)" }}
        >
          <GolferAvatar appearance={previewAppearance} size={160} />
        </div>

        <div>
          <div className="pa-section-label">NAME</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="YOUR NAME"
            style={{
              all: "unset",
              boxSizing: "border-box",
              width: "100%",
              background: "#ffffff",
              border: "3px solid var(--pa-ink)",
              padding: "10px 12px",
              fontFamily: "var(--pa-font-body)",
              fontSize: 18,
              color: "var(--pa-ink)",
            }}
          />
        </div>

        <div>
          <div className="pa-section-label">SKIN TONE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {skinTones.map((color) => (
              <Swatch key={color} color={color} selected={skinTone === color} onClick={() => setSkinTone(color)} />
            ))}
          </div>
        </div>

        <div>
          <div className="pa-section-label">HAT COLOUR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {hatColors.map((color) => (
              <Swatch key={color} color={color} selected={hatColor === color} onClick={() => setHatColor(color)} />
            ))}
          </div>
        </div>

        <div>
          <div className="pa-section-label">SHIRT COLOUR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {shirtColors.map((color) => (
              <Swatch key={color} color={color} selected={shirtColor === color} onClick={() => setShirtColor(color)} />
            ))}
          </div>
        </div>
      </div>

      <div className="pa-sticky-footer">
        <button className="pa-cta" disabled={!canSubmit} onClick={handleSubmit}>
          {isEdit ? "SAVE CHANGES" : "BEGIN CAREER"}
        </button>
      </div>
      {isEdit && <FlaticonAttribution />}
    </div>
  );
}
