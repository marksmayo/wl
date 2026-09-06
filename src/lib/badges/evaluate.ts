import "server-only";
import { prisma } from "@/lib/prisma";
import { todayDateKey } from "@/lib/competition";
import {
  BADGES_BY_ID,
  BadgeDefinition,
  signinStreakId,
  weighinCountId,
  weighinStreakId,
  percentId,
  SIGNIN_STREAK_DAYS,
  WEIGHIN_COUNT_DAYS,
  WEIGHIN_STREAK_DAYS,
  PERCENT_THRESHOLDS,
} from "./definitions";
import { longestStreak } from "./streaks";
import type { Device } from "./device";

export type EvaluateOptions = {
  userId: string;
  /** Record today as a visited day and re-check sign-in-streak badges. */
  recordVisit?: boolean;
  device?: Device;
  markViewedSettings?: boolean;
  markViewedLeaderboard?: boolean;
  /** This user's current leaderboard rank, if known from the calling page. */
  rank?: number | null;
  /** Pass right after a weigh-in is logged to check weigh-in based badges. */
  afterWeighIn?: {
    /** Every date (YYYY-MM-DD) this user has ever logged, any order. */
    weighInDates: string[];
    firstWeight: number;
    latestWeight: number;
    /** Weight from the most recent entry strictly before the one just submitted. */
    previousWeight: number | null;
  };
};

/**
 * Checks the given context against every badge the user doesn't already
 * have, records any newly-earned ones, and returns just those (for a toast).
 * Safe to call on every relevant page load / action — it's a no-op once a
 * badge is already recorded.
 */
export async function evaluateAndAwardBadges(
  opts: EvaluateOptions
): Promise<BadgeDefinition[]> {
  const existing = await prisma.userBadge.findMany({
    where: { userId: opts.userId },
    select: { badgeId: true },
  });
  const have = new Set(existing.map((b) => b.badgeId));
  const toAward = new Set<string>();

  function consider(id: string, earned: boolean) {
    if (earned && !have.has(id)) toAward.add(id);
  }

  if (opts.recordVisit) {
    const today = todayDateKey();
    await prisma.dailyVisit.upsert({
      where: { userId_date: { userId: opts.userId, date: new Date(`${today}T00:00:00.000Z`) } },
      update: {},
      create: { userId: opts.userId, date: new Date(`${today}T00:00:00.000Z`) },
    });

    const visits = await prisma.dailyVisit.findMany({
      where: { userId: opts.userId },
      select: { date: true },
    });
    const streak = longestStreak(visits.map((v) => v.date.toISOString().slice(0, 10)));
    for (const days of SIGNIN_STREAK_DAYS) {
      consider(signinStreakId(days), streak >= days);
    }
  }

  if (opts.device === "desktop") consider("device-desktop", true);
  if (opts.device === "mobile") consider("device-mobile", true);
  if (opts.markViewedSettings) consider("viewed-settings", true);
  if (opts.markViewedLeaderboard) consider("viewed-leaderboard", true);

  if (opts.rank === 1) consider("rank-1", true);
  if (opts.rank === 2) consider("rank-2", true);
  if (opts.rank === 3) consider("rank-3", true);

  if (opts.afterWeighIn) {
    const { weighInDates, firstWeight, latestWeight, previousWeight } = opts.afterWeighIn;

    consider("first-weigh-in", weighInDates.length >= 1);

    for (const days of WEIGHIN_COUNT_DAYS) {
      consider(weighinCountId(days), weighInDates.length >= days);
    }

    const streak = longestStreak(weighInDates);
    for (const days of WEIGHIN_STREAK_DAYS) {
      consider(weighinStreakId(days), streak >= days);
    }

    if (firstWeight > 0) {
      const droppedPct = ((firstWeight - latestWeight) / firstWeight) * 100;
      for (const pct of PERCENT_THRESHOLDS) {
        consider(percentId(pct), droppedPct >= pct);
      }
    }

    if (previousWeight !== null && latestWeight > previousWeight) {
      consider("oopsie", true);
    }
  }

  if (toAward.size === 0) return [];

  await prisma.userBadge.createMany({
    data: Array.from(toAward).map((badgeId) => ({ userId: opts.userId, badgeId })),
    skipDuplicates: true,
  });

  return Array.from(toAward)
    .map((id) => BADGES_BY_ID[id])
    .filter((b): b is BadgeDefinition => Boolean(b));
}
