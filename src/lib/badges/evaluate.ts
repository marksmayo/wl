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
  rankId,
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
  markViewedOwnBadges?: boolean;
  markViewedOtherBadges?: boolean;
  /** Every leaderboard rank (1-9) this user has ever held, if known from the calling page. */
  ranksEverHeld?: Iterable<number>;
  /** Pass right after a weigh-in is logged to check weigh-in based badges. */
  afterWeighIn?: {
    /** Every date (YYYY-MM-DD) this user has ever logged, any order. */
    weighInDates: string[];
    firstWeight: number;
    latestWeight: number;
    /** Weight from the most recent entry strictly before the one just submitted. */
    previousWeight: number | null;
    /**
     * Set when checking a user's full history at once (backfill) rather
     * than a single new submission — true if any entry anywhere in their
     * history was a gain over the entry immediately before it.
     */
    everGained?: boolean;
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
  if (opts.markViewedOwnBadges) consider("viewed-own-badges", true);
  if (opts.markViewedOtherBadges) consider("viewed-other-badges", true);

  if (opts.ranksEverHeld) {
    for (const rank of opts.ranksEverHeld) {
      consider(rankId(rank), true);
    }
  }

  if (opts.afterWeighIn) {
    const { weighInDates, firstWeight, latestWeight, previousWeight, everGained } =
      opts.afterWeighIn;

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

    const gainedOnLastEntry = previousWeight !== null && latestWeight > previousWeight;
    consider("oopsie", gainedOnLastEntry || Boolean(everGained));
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
