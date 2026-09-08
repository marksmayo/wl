import type { ComponentType } from "react";
import {
  BiteIcon,
  RollingPinIcon,
  MenuIcon,
  FlameIcon,
  ChefHatIcon,
  UtensilsIcon,
  DripIcon,
  UtensilsMedalIcon,
  PizzaSliceIcon,
  TableIcon,
  TakeoutBoxIcon,
  FridgeIcon,
  PlateEnvyIcon,
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
  { days: 2, name: "Daily Special" },
  { days: 5, name: "Weekly Regular" },
  { days: 10, name: "Loyal Patron" },
  { days: 25, name: "House Favorite" },
  { days: 50, name: "Kitchen Regular" },
  { days: 90, name: "Legendary Regular" },
] as const;

const WEIGHIN_COUNT_TIERS = [
  { days: 2, name: "Prep Cook" },
  { days: 5, name: "Line Cook" },
  { days: 10, name: "Sous Chef" },
  { days: 25, name: "Head Chef" },
  { days: 50, name: "Executive Chef" },
  { days: 90, name: "Iron Chef" },
] as const;

const WEIGHIN_STREAK_TIERS = [
  { days: 2, name: "Two-Course Meal" },
  { days: 5, name: "Five-Course Feast" },
  { days: 10, name: "Ten-Course Tasting" },
  { days: 25, name: "Quarter-Century Buffet" },
  { days: 50, name: "Fifty-Course Banquet" },
  { days: 90, name: "The Whole Banquet" },
] as const;

const PERCENT_TIERS = [
  { pct: 1, name: "Light Bite" },
  { pct: 2, name: "Trimmed the Fat" },
  { pct: 5, name: "Lean Cuisine" },
  { pct: 7.5, name: "Downsized Diet" },
  { pct: 10, name: "Double-Digit Diet" },
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
    name: "First Bite",
    description: "Logged your very first weigh-in.",
    icon: BiteIcon,
  },
  {
    id: "viewed-settings",
    name: "Recipe Tweaker",
    description: "Checked out the settings panel.",
    icon: RollingPinIcon,
  },
  {
    id: "viewed-leaderboard",
    name: "Specials Board",
    description: "Checked the leaderboard.",
    icon: MenuIcon,
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
    icon: tieredIcon(ChefHatIcon, TIER_COLORS[i]),
  })),
  ...WEIGHIN_STREAK_TIERS.map((tier, i) => ({
    id: weighinStreakId(tier.days),
    name: tier.name,
    description: `Logged your weight ${tier.days} days in a row.`,
    icon: tieredIcon(UtensilsIcon, TIER_COLORS[i]),
  })),
  ...PERCENT_TIERS.map((tier, i) => ({
    id: percentId(tier.pct),
    name: tier.name,
    description: `Dropped ${tier.pct}% or more since your first weigh-in.`,
    icon: tieredIcon(DripIcon, TIER_COLORS[i]),
  })),
  {
    id: "rank-1",
    name: "Golden Fork",
    description: "Reached #1 on the leaderboard.",
    icon: tieredIcon(UtensilsMedalIcon, RANK_COLORS[1]),
  },
  {
    id: "rank-2",
    name: "Silver Spoon",
    description: "Reached #2 on the leaderboard.",
    icon: tieredIcon(UtensilsMedalIcon, RANK_COLORS[2]),
  },
  {
    id: "rank-3",
    name: "Bronze Ladle",
    description: "Reached #3 on the leaderboard.",
    icon: tieredIcon(UtensilsMedalIcon, RANK_COLORS[3]),
  },
  {
    id: "oopsie",
    name: "Cheat Day",
    description: "Logged a weight higher than your previous entry. It happens!",
    icon: tieredIcon(PizzaSliceIcon, "#ff6b6b"),
  },
  {
    id: "device-desktop",
    name: "Dining Table",
    description: "Used the site on a desktop browser.",
    icon: TableIcon,
  },
  {
    id: "device-mobile",
    name: "Takeout",
    description: "Used the site on a mobile browser.",
    icon: TakeoutBoxIcon,
  },
  {
    id: "viewed-own-badges",
    name: "Fridge Check",
    description: "Checked out your own badge collection.",
    icon: FridgeIcon,
  },
  {
    id: "viewed-other-badges",
    name: "Plate Envy",
    description: "Checked out someone else's badge collection.",
    icon: PlateEnvyIcon,
  },
];

export const BADGES_BY_ID: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
);
