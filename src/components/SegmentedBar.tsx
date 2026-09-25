interface SegmentedBarProps {
  value: number;
  max?: number;
}

export function SegmentedBar({ value, max = 10 }: SegmentedBarProps) {
  return (
    <div className="pa-bar">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`pa-bar-segment${i < value ? " filled" : ""}`} />
      ))}
    </div>
  );
}
