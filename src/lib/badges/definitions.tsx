import type { ComponentType } from "react";
import {
  FootprintIcon,
  GearIcon,
  TrophyIcon,
  FlameIcon,
  ChainIcon,
  StackIcon,
  ArrowDownCircleIcon,
  MedalIcon,
  OopsieIcon,
  DesktopIcon,
  MobileIcon,
  TIER_COLORS,
  RANK_COLORS,
} from "./icons";

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const SIGNIN_STREAK_TIERS = [
  { days: 2, name: "Warming Up" },
  { days: 5, name: "On a Roll" },
  { days: 10, name: "Perfect Attendance" },
  { days: 25, name: "Habit Formed" },
  { days: 50, name: "Unstoppable" },
  { days: 90, name: "Legendary Streak" },
] as const;

const WEIGHIN_COUNT_TIERS = [
  { days: 2, name: "Getting Started" },
  { days: 5, name: "Tracker" },
  { days: 10, name: "Data Nerd" },
  { days: 25, name: "Dedicated Logger" },
  { days: 50, name: "Half Century" },
  { days: 90, name: "90-Day Veteran" },
] as const;

const WEIGHIN_STREAK_TIERS = [
  { days: 2, name: "Back-to-Back" },
  { days: 5, name: "Five in a Row" },
  { days: 10, name: "Perfect Ten" },
  { days: 25, name: "Quarter-Century Chain" },
  { days: 50, name: "Fifty Fire" },
  { days: 90, name: "Iron Will" },
] as const;

const PERCENT_TIERS = [
  { pct: 1, name: "First Drop" },
  { pct: 2, name: "Making Moves" },
  { pct: 5, name: "High Five" },
  { pct: 7.5, name: "Overachiever" },
  { pct: 10, name: "Double Digits" },
] as const;

export function signinStreakId(days: number) {
  return `signin-streak-${days}`;
}
export function weighinCountId(days: number) {
  return `weighin-count-${days}`;
}
export function weighinStreakId(days: number) {
  return `weighin-streak-${days}`;
}
export function percentId(pct: number) {
  return `percent-${String(pct).replace(".", "-")}`;
}

// Thresholds exported separately (not just derived from BADGES) so the
// evaluator can iterate "days" / "pct" numbers directly without re-parsing
// them back out of badge ids.
export const SIGNIN_STREAK_DAYS = SIGNIN_STREAK_TIERS.map((t) => t.days);
export const WEIGHIN_COUNT_DAYS = WEIGHIN_COUNT_TIERS.map((t) => t.days);
export const WEIGHIN_STREAK_DAYS = WEIGHIN_STREAK_TIERS.map((t) => t.days);
export const PERCENT_THRESHOLDS = PERCENT_TIERS.map((t) => t.pct);

function tieredIcon(Icon: ComponentType<{ color?: string; className?: string }>, color: string) {
  return function TieredIcon({ className }: { className?: string }) {
    return <Icon color={color} className={className} />;
  };
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-weigh-in",
    name: "Baby Steps",
    description: "Logged your very first weigh-in.",
    icon: FootprintIcon,
  },
  {
    id: "viewed-settings",
    name: "Behind the Scenes",
    description: "Checked out the settings panel.",
    icon: GearIcon,
  },
  {
    id: "viewed-leaderboard",
    name: "Scoreboard Watcher",
    description: "Checked the leaderboard.",
    icon: TrophyIcon,
  },
  ...SIGNIN_STREAK_TIERS.map((tier, i) => ({
    id: signinStreakId(tier.days),
    name: tier.name,
    description: `Visited ${tier.days} days in a row.`,
    icon: tieredIcon(FlameIcon, TIER_COLORS[i]),
  })),
  ...WEIGHIN_COUNT_TIERS.map((tier, i) => ({
    id: weighinCountId(tier.days),
    name: tier.name,
    description: `Logged your weight on ${tier.days} different days.`,
    icon: tieredIcon(StackIcon, TIER_COLORS[i]),
  })),
  ...WEIGHIN_STREAK_TIERS.map((tier, i) => ({
    id: weighinStreakId(tier.days),
    name: tier.name,
    description: `Logged your weight ${tier.days} days in a row.`,
    icon: tieredIcon(ChainIcon, TIER_COLORS[i]),
  })),
  ...PERCENT_TIERS.map((tier, i) => ({
    id: percentId(tier.pct),
    name: tier.name,
    description: `Dropped ${tier.pct}% or more since your first weigh-in.`,
    icon: tieredIcon(ArrowDownCircleIcon, TIER_COLORS[i]),
  })),
  {
    id: "rank-1",
    name: "Champion",
    description: "Reached #1 on the leaderboard.",
    icon: tieredIcon(MedalIcon, RANK_COLORS[1]),
  },
  {
    id: "rank-2",
    name: "Runner-Up",
    description: "Reached #2 on the leaderboard.",
    icon: tieredIcon(MedalIcon, RANK_COLORS[2]),
  },
  {
    id: "rank-3",
    name: "On the Podium",
    description: "Reached #3 on the leaderboard.",
    icon: tieredIcon(MedalIcon, RANK_COLORS[3]),
  },
  {
    id: "oopsie",
    name: "Oopsie!",
    description: "Logged a weight higher than your previous entry. It happens!",
    icon: tieredIcon(OopsieIcon, "#ff6b6b"),
  },
  {
    id: "device-desktop",
    name: "Desktop Warrior",
    description: "Used the site on a desktop browser.",
    icon: DesktopIcon,
  },
  {
    id: "device-mobile",
    name: "Pocket Tracker",
    description: "Used the site on a mobile browser.",
    icon: MobileIcon,
  },
];

export const BADGES_BY_ID: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
);
