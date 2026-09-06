// A small set of reusable food/kitchen-themed line-icon shapes, tinted
// per-badge via `color` (defaults to currentColor). Escalating tiers
// (streaks, % milestones) reuse the same shape and step through
// TIER_COLORS instead of getting a bespoke drawing per threshold — keeps
// 32 badges visually consistent instead of a grab-bag of unrelated icons.

export const TIER_COLORS = [
  "#a0a4ad", // tier 1 — muted slate
  "#34e0a1", // tier 2 — app accent (teal)
  "#38bdf8", // tier 3 — sky
  "#7c5cff", // tier 4 — app accent-2 (violet)
  "#f59e0b", // tier 5 — amber
  "#f43f5e", // tier 6 — rose (top tier)
] as const;

export const RANK_COLORS = {
  1: "#ffd700", // gold
  2: "#c0c0c0", // silver
  3: "#cd7f32", // bronze
} as const;

type IconProps = { color?: string; className?: string };

const base = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// First Bite — a cookie with a bite taken out and a few choc-chip dots.
export function BiteIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M12 4.5c4.4 0 7.5 3.3 7.5 7.3 0 4.3-3.5 7.7-7.8 7.7-4.2 0-7.2-3.2-7.2-7.2 0-1 .2-1.9.5-2.7" />
      <path d="M12 4.5c-1 1-1 2.3 0 3.3s2.4 1 3.4 0" />
      <circle cx="10" cy="12.5" r="0.9" fill={color} stroke="none" />
      <circle cx="14.5" cy="10.5" r="0.9" fill={color} stroke="none" />
      <circle cx="13" cy="15.5" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

// Recipe Tweaker — a rolling pin, for reshaping your recipe.
export function RollingPinIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="7" y="10.5" width="10" height="3" rx="1.5" />
      <circle cx="5.3" cy="12" r="2.1" />
      <circle cx="18.7" cy="12" r="2.1" />
    </svg>
  );
}

// Specials Board — a chalkboard/menu with a few written lines.
export function MenuIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
      <path d="M7.5 8h9M7.5 11.5h9M7.5 15h5.5" />
    </svg>
  );
}

// Sign-in streaks — a stove-top flame, staying lit day after day.
export function FlameIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M12 2c1 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c1.5 1 2.5 3 2.5 5a5 5 0 0 1-10 0c0-4 2-5 2-7 0 0-1.5 1-1.5 3" />
      <path d="M9.5 16.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

// Weigh-in count tiers — a chef's toque, for climbing the kitchen ranks.
export function ChefHatIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M8.5 11c-2 0-3.5-1.6-3.5-3.5S6.5 4 8.5 4c.4 0 .8.1 1.1.2A3.5 3.5 0 0 1 12 3a3.5 3.5 0 0 1 2.4 1.2c.3-.1.7-.2 1.1-.2 2 0 3.5 1.6 3.5 3.5S17.5 11 15.5 11" />
      <path d="M8.5 11h7v3.5h-7z" />
      <path d="M7 14.5h10V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4.5Z" />
    </svg>
  );
}

// Weigh-in streak tiers — a place setting: fork and knife, day after day.
export function UtensilsIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M6 3v5.5a1.5 1.5 0 0 0 3 0V3M7.5 3v18M6 3v3.5M9 3v3.5" />
      <path d="M17 3c-1.7 2-1.7 5.5 0 7.5.5.6.8 1 .8 1.8V21" />
    </svg>
  );
}

// Percent-loss tiers — an ice cube melting away, drip by drip.
export function DripIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="7" y="3.5" width="10" height="9" rx="1.4" />
      <path d="M7 8h10M12 3.5v9" />
      <path d="M9.3 16.2c0 1.4-1.1 1.9-1.1 3.3a1.1 1.1 0 0 0 2.2 0c0-1.4-1.1-1.9-1.1-3.3Z" />
      <path d="M14.7 16.2c0 1.4-1.1 1.9-1.1 3.3a1.1 1.1 0 0 0 2.2 0c0-1.4-1.1-1.9-1.1-3.3Z" />
    </svg>
  );
}

// Rank medals — a ribboned medal with a fork at its center.
export function UtensilsMedalIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M8 3h8l-3 7h-2L8 3Z" />
      <circle cx="12" cy="15" r="6" />
      <path d="M9.7 11.6v2.2M12 11.6v2.2M14.3 11.6v2.2" />
      <path d="M9.7 13.8c0 1 1 1 2.3 1s2.3 0 2.3-1" />
      <path d="M12 14.8v4.7" />
    </svg>
  );
}

// Oopsie / Cheat Day — a pepperoni pizza slice.
export function PizzaSliceIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M12 3 4 19h16L12 3Z" />
      <path d="M6.7 15.2c3.6-1 7-1 10.6 0" />
      <circle cx="11" cy="10.5" r="0.9" fill={color} stroke="none" />
      <circle cx="13.5" cy="13" r="0.9" fill={color} stroke="none" />
      <circle cx="10.3" cy="14" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

// Desktop device — a plate set at the dining table.
export function TableIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <circle cx="12" cy="6.5" r="2.6" />
      <path d="M3 11h18M5.5 11v9M18.5 11v9" />
    </svg>
  );
}

// Mobile device — a takeout box, food on the go.
export function TakeoutBoxIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M5 9 7 4h10l2 5" />
      <path d="M5 9h14v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V9Z" />
      <path d="M12 9v3.5" />
    </svg>
  );
}
