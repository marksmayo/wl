// A small set of reusable line-icon shapes, tinted per-badge via `color`
// (defaults to currentColor). Escalating tiers (streaks, % milestones)
// reuse the same shape and step through TIER_COLORS instead of getting a
// bespoke drawing per threshold — keeps 32 badges visually consistent
// instead of a grab-bag of unrelated icons.

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

export function FootprintIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M8 3c-2 0-3 2-3 4.5S6 12 6 15c0 2-1 3-1 4.5A2.5 2.5 0 0 0 7.5 22c1.8 0 2.5-1.3 2.5-3v-6c0-3-1-6-1-6.5C9 5 9 3 8 3Z" />
      <circle cx="6.2" cy="5.3" r="0.9" fill={color} stroke="none" />
      <path d="M17 8c2 0 3 2 3 4.5S18 17 18 20c0 1-1 2-2 2s-2-.7-2-2v-4c0-2 1-4 1-4.5 0-2.5 0-6 2-6Z" />
      <circle cx="18.3" cy="10.2" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

export function GearIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7 6.2 6.2" />
    </svg>
  );
}

export function TrophyIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z" />
      <path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M9.5 20c0-1.7.7-2.6 2.5-3 1.8.4 2.5 1.3 2.5 3" />
    </svg>
  );
}

export function FlameIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M12 2c1 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c1.5 1 2.5 3 2.5 5a5 5 0 0 1-10 0c0-4 2-5 2-7 0 0-1.5 1-1.5 3" />
      <path d="M9.5 16.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function ChainIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="3" y="8" width="7" height="8" rx="3.5" />
      <rect x="14" y="8" width="7" height="8" rx="3.5" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function StackIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="5" y="4" width="12" height="6" rx="1.3" />
      <path d="M5 12h12M6 12v5.5A1.5 1.5 0 0 0 7.5 19h9a1.5 1.5 0 0 0 1.5-1.5V12" />
      <path d="m8.5 6.6 1.7 1.7L13.5 5" />
    </svg>
  );
}

export function ArrowDownCircleIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v8M8.5 12 12 15.5 15.5 12" />
    </svg>
  );
}

export function MedalIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M8 3h8l-3 7h-2L8 3Z" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12.3 13 15h2l-1.6 1.2.6 2-1.9-1.2-2 1.2.6-2L9 15h2l1-2.7Z" fill={color} stroke="none" />
    </svg>
  );
}

export function OopsieIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <path d="M4 15c3-1 4-3 5.5-6.5C10.7 5.8 12 5 13 5.5c1.2.6 1 2-.3 3.8" />
      <circle cx="17.5" cy="6.5" r="2" />
      <circle cx="8" cy="18" r="3" />
      <path d="M6.7 16.8 9.3 19.2M9.3 16.8 6.7 19.2" />
    </svg>
  );
}

export function DesktopIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  );
}

export function MobileIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 19h2" />
    </svg>
  );
}

export function ScaleIcon({ color = "currentColor", className }: IconProps) {
  return (
    <svg {...base} stroke={color} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="12" cy="12.5" r="4.2" />
      <path d="M12 8.3v0.1M12 12.5 9.7 11" />
      <path d="M9.5 4 8 2M14.5 4 16 2" />
    </svg>
  );
}
