const MEDALS = ["🥇", "🥈", "🥉"];

const RANK_BADGE_STYLE = [
  {
    gradient: "from-yellow-300 to-amber-600",
    glow: "shadow-[0_0_14px_-3px_rgba(250,204,21,0.75)]",
  },
  {
    gradient: "from-slate-200 to-slate-400",
    glow: "shadow-[0_0_14px_-3px_rgba(203,213,225,0.6)]",
  },
  {
    gradient: "from-orange-300 to-amber-700",
    glow: "shadow-[0_0_14px_-3px_rgba(217,119,6,0.6)]",
  },
];

const BOX_CLASSES = {
  sm: "h-8 w-8 sm:h-9 sm:w-9",
  lg: "h-12 w-12",
};
const MEDAL_TEXT_CLASSES = {
  sm: "text-sm sm:text-base",
  lg: "text-2xl",
};
const NUMBER_TEXT_CLASSES = {
  sm: "text-xs",
  lg: "text-base",
};

/**
 * The one gold/silver/bronze rank badge used everywhere a numeric rank is
 * shown (leaderboard rows, dashboard "Your rank" tile) — same shapes and
 * colors so a #1 reads the same wherever it appears.
 */
export function RankMedal({
  rank,
  size = "sm",
}: {
  rank: number | null;
  size?: "sm" | "lg";
}) {
  const style = rank && rank <= 3 ? RANK_BADGE_STYLE[rank - 1] : null;
  const boxClass = BOX_CLASSES[size];

  if (style) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${boxClass} ${MEDAL_TEXT_CLASSES[size]} ${style.gradient} ${style.glow}`}
        title={`Rank #${rank}`}
      >
        {MEDALS[rank! - 1]}
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-mono text-muted ${boxClass} ${NUMBER_TEXT_CLASSES[size]}`}
    >
      {rank ? `#${rank}` : "—"}
    </span>
  );
}
