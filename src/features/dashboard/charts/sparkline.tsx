interface SparklineProps {
  values: number[];
  label: string;
}

const WIDTH = 120;
const HEIGHT = 36;
const PAD = 4;

/** A tiny trend line with its latest value marked; the label tells screen readers what it shows. */
export function Sparkline({ values, label }: SparklineProps) {
  const max = Math.max(1, ...values);
  const step = (WIDTH - PAD * 2) / Math.max(1, values.length - 1);
  const points = values.map((value, index) => [
    PAD + index * step,
    HEIGHT - PAD - (value / max) * (HEIGHT - PAD * 2),
  ]);
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const [lastX, lastY] = points.at(-1) ?? [0, 0];

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-9 w-full">
      <polygon
        points={`${PAD},${HEIGHT - PAD} ${line} ${WIDTH - PAD},${HEIGHT - PAD}`}
        fill="var(--chart-sequence)"
        opacity={0.12}
      />
      <polyline
        points={line}
        fill="none"
        stroke="var(--chart-sequence)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={4}
        fill="var(--chart-sequence)"
        stroke="var(--panel)"
        strokeWidth={2}
      />
    </svg>
  );
}
