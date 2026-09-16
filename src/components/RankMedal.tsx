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
  // Mobile stays 32px (tight quarters in the leaderboard card header,
  // tuned to avoid crowding out long names) but gets noticeably more
  // room from `sm:` up, where there's space to spare.
  sm: "h-8 w-8 sm:h-10 sm:w-10",
  lg: "h-14 w-14",
};
const MEDAL_TEXT_CLASSES = {
  sm: "text-base sm:text-xl",
  lg: "text-3xl",
};
const NUMBER_TEXT_CLASSES = {
  // Bumped up from text-xs — the plain "#N" rank number was reported hard
  // to read; this is the biggest bump that still fits a 3-digit rank in
  // the unchanged 32px mobile circle.
  sm: "text-sm sm:text-lg",
  lg: "text-lg",
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
        // overflow-hidden resets this flex item's automatic min-width from
        // "content size" to 0 (per the flexbox spec), so the explicit
        // h-*/w-* actually caps it instead of the bigger text quietly
        // widening it and stealing space from the name next to it.
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${boxClass} ${MEDAL_TEXT_CLASSES[size]} ${style.gradient} ${style.glow}`}
        title={`Rank #${rank}`}
      >
        {MEDALS[rank! - 1]}
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 font-mono text-muted ${boxClass} ${NUMBER_TEXT_CLASSES[size]}`}
    >
      {rank ? `#${rank}` : "—"}
    </span>
  );
}
