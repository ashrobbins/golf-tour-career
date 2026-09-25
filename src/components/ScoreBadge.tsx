interface ScoreBadgeProps {
  label: string;
  scoreToPar: number;
  size?: number;
  parColor?: string;
}

const BIRDIE_EAGLE_COLOR = "#1f7a3d";
const BOGEY_WORSE_COLOR = "#c1362b";

/** Standard scorecard color convention — green for birdie-or-better, red for
 *  bogey-or-worse — but spelled out as a word (PAR, BIRDIE, BOGEY, ...)
 *  instead of a number in a shape, so it reads at a glance without needing
 *  to know scorecard notation. */
export function ScoreBadge({ label, scoreToPar, size = 64, parColor = "var(--pa-ink)" }: ScoreBadgeProps) {
  const isUnder = scoreToPar < 0;
  const isOver = scoreToPar > 0;
  const color = isUnder ? BIRDIE_EAGLE_COLOR : isOver ? BOGEY_WORSE_COLOR : parColor;

  return (
    <div
      className="pa-title"
      style={{
        fontSize: size * 0.32,
        color,
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}
