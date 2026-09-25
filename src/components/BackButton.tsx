import type { CSSProperties } from "react";
import backIcon from "../assets/back-icon.png";

interface BackButtonProps {
  onClick: () => void;
  style?: CSSProperties;
}

export function BackButton({ onClick, style }: BackButtonProps) {
  return (
    <button className="pa-header-back" onClick={onClick} style={style}>
      <img src={backIcon} alt="Back" style={{ height: 16, width: "auto", imageRendering: "pixelated" }} />
    </button>
  );
}
