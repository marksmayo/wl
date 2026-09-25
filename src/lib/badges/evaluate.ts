import "server-only";
import { after } from "next/server";
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

/**
 * The two per-user reads every evaluation needs. Pages load this in the same
 * `Promise.all` as their other data (see `loadBadgeContext`) so the badge
 * check adds no extra database round trip to the render.
 */
export type BadgeContext = {
  /** Every badgeId this user already holds. */
  existingBadgeIds: string[];
  /** Every date (YYYY-MM-DD) this user has visited an authenticated page. */
  visitDates: string[];
};

export async function loadBadgeContext(userId: string): Promise<BadgeContext> {
  const [existing, visits] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    prisma.dailyVisit.findMany({ where: { userId }, select: { date: true } }),
  ]);
  return {
    existingBadgeIds: existing.map((b) => b.badgeId),
    visitDates: visits.map((v) => v.date.toISOString().slice(0, 10)),
  };
}

export type EvaluateOptions = {
  userId: string;
  /** Pre-fetched reads (see loadBadgeContext); loaded here if omitted. */
  context?: BadgeContext;
  /** Record today as a visited day and re-check sign-in-streak badges. */
  recordVisit?: boolean;
  /**
   * Overrides todayDateKey() (server UTC) for the recordVisit check — pass
   * the visitor's real local date when known. UTC lags AU/NZ visitors by
   * hours, so two visits that are genuinely on consecutive local days can
   * otherwise land on the same UTC date and silently stall a streak (see
   * recordLocalVisitAction).
   */
  visitDateKey?: string;
  device?: Device;
  markViewedSettings?: boolean;
  markViewedLeaderboard?: boolean;
  markViewedOwnBadges?: boolean;
  markViewedOtherBadges?: boolean;
  /** Every leaderboard rank (1-9) this user has ever held, if known from the calling page. */
  ranksEverHeld?: Iterable<number>;
  /** Was this user the earliest logger (by createdAt) for the date they just submitted? */
  wasFirstOfDay?: boolean;
  /** Was this user the latest logger (by createdAt) for the date they just submitted, as of now? */
  wasLastOfDay?: boolean;
  /** Set right after successfully setting a weight-loss goal. */
  markSetGoal?: boolean;
  /** Set right after successfully setting a height (BMI can now be calculated). */
  markSetHeight?: boolean;
  /** Set right after the user clicks Replay on the Weight Loss Race chart. */
  markReplayedWeightLossRace?: boolean;
  /** Set right after the user clicks Replay on the Goal Progress race chart. */
  markReplayedGoalProgressRace?: boolean;
  /** This user's currently-set weight-loss goal (%), if any — checked against afterWeighIn's droppedPct. */
  goalPercent?: number | null;
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
  const context = opts.context ?? (await loadBadgeContext(opts.userId));
  const have = new Set(context.existingBadgeIds);
  const toAward = new Set<string>();

  function consider(id: string, earned: boolean) {
    if (earned && !have.has(id)) toAward.add(id);
  }

  if (opts.recordVisit) {
    const today = opts.visitDateKey ?? todayDateKey();
    const visitDates = context.visitDates.includes(today)
      ? context.visitDates
      : [...context.visitDates, today];

    // Today's visit row only matters for future streak checks, so the write
    // runs after the response has been sent rather than delaying it.
    if (!context.visitDates.includes(today)) {
      after(async () => {
        await prisma.dailyVisit.upsert({
          where: { userId_date: { userId: opts.userId, date: new Date(`${today}T00:00:00.000Z`) } },
          update: {},
          create: { userId: opts.userId, date: new Date(`${today}T00:00:00.000Z`) },
        });
      });
    }

    const streak = longestStreak(visitDates);
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

  if (opts.wasFirstOfDay) consider("first-of-day", true);
  if (opts.wasLastOfDay) consider("last-of-day", true);
  if (opts.markSetGoal) consider("goal-set", true);
  if (opts.markSetHeight) consider("height-set", true);
  if (opts.markReplayedWeightLossRace) consider("replayed-weight-loss-race", true);
  if (opts.markReplayedGoalProgressRace) consider("replayed-goal-progress-race", true);

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
      if (opts.goalPercent != null && opts.goalPercent > 0) {
        consider("goal-met", droppedPct >= opts.goalPercent);
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
