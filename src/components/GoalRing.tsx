const SIZE = 34;
const STROKE = 3.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GoalRing({
  progress,
  title,
}: {
  progress: number | null;
  title?: string;
}) {
  const hasGoal = progress !== null;
  const clamped = hasGoal ? Math.max(0, Math.min(100, progress)) : 0;
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      title={title ?? (hasGoal ? `${Math.round(clamped)}% of the way to your goal` : "No goal set")}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--border)"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={hasGoal ? undefined : "2 3"}
        />
        {hasGoal && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={clamped >= 100 ? "var(--accent)" : "var(--accent-2)"}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        )}
      </svg>
      <span className="absolute text-[9px] font-medium text-muted">
        {hasGoal ? `${Math.round(clamped)}%` : "–"}
      </span>
    </div>
  );
}
