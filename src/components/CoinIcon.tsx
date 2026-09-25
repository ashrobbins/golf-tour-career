import coin from "../assets/coin.png";

interface CoinIconProps {
  size?: number;
}

export function CoinIcon({ size = 18 }: CoinIconProps) {
  return (
    <img
      src={coin}
      alt=""
      style={{ height: size, width: "auto", imageRendering: "pixelated", verticalAlign: "middle" }}
    />
  );
}
