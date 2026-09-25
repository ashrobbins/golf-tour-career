import trophy from "../assets/trophy.svg";

interface TrophyIconProps {
  size?: number;
  grayscale?: boolean;
}

export function TrophyIcon({ size = 38, grayscale = false }: TrophyIconProps) {
  return (
    <img
      src={trophy}
      alt=""
      style={{
        height: size,
        width: size,
        flexShrink: 0,
        filter: grayscale ? "grayscale(1) opacity(0.4)" : undefined,
      }}
    />
  );
}
