import "server-only";
import { prisma } from "@/lib/prisma";
import { getLeaderboardData } from "@/lib/leaderboard";
import { evaluateAndAwardBadges } from "./evaluate";
import { computeRanksEverHeld } from "./rankHistory";
import { buildAfterWeighInContext } from "./weighinContext";

export type BackfillResult = {
  userId: string;
  fullName: string;
  newBadges: string[];
};

/**
 * Retroactively awards badges based on data that already existed before the
 * badge system shipped — weigh-in history, the leaderboard rank each user
 * has ever held, and who was first/last (by createdAt) to log on each date.
 * Safe to re-run: evaluateAndAwardBadges only ever adds badges a user
 * doesn't already have.
 *
 * This same check also runs automatically for one user at a time on every
 * dashboard load (see src/app/dashboard/page.tsx), so this bulk version is
 * mostly useful for getting everyone caught up in one shot right after a
 * deploy, rather than waiting for each person to visit their dashboard.
 *
 * Deliberately does NOT backfill sign-in streaks, viewed-settings,
 * viewed-leaderboard, or the device badges — none of that activity was
 * recorded before badges existed, and faking history for it would be
 * dishonest. Those simply start accumulating from each user's next visit.
 */
export async function backfillBadges(): Promise<BackfillResult[]> {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, goalPercent: true },
    orderBy: { createdAt: "asc" },
  });

  const { chartData, participants } = await getLeaderboardData();
  const ranksEverHeld = computeRanksEverHeld(chartData, participants);
  const { firstOfDayUserIds, lastOfDayUserIds } = await computeDayPositions();

  const results: BackfillResult[] = [];

  for (const user of users) {
    const weighIns = await prisma.weighIn.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      select: { date: true, weight: true },
    });

    const newBadges = await evaluateAndAwardBadges({
      userId: user.id,
      ranksEverHeld: ranksEverHeld.get(user.id),
      wasFirstOfDay: firstOfDayUserIds.has(user.id),
      wasLastOfDay: lastOfDayUserIds.has(user.id),
      markSetGoal: user.goalPercent != null,
      goalPercent: user.goalPercent,
      afterWeighIn: buildAfterWeighInContext(weighIns),
    });

    if (newBadges.length > 0) {
      results.push({ userId: user.id, fullName: user.fullName, newBadges: newBadges.map((b) => b.id) });
    }
  }

  return results;
}

/**
 * Across every logged date, who was earliest (by createdAt) and who was
 * latest — for Early Bird Special / Last Call. A user need only hold either
 * position on ONE date, ever, to earn the badge.
 */
async function computeDayPositions(): Promise<{
  firstOfDayUserIds: Set<string>;
  lastOfDayUserIds: Set<string>;
}> {
  const allEntries = await prisma.weighIn.findMany({
    select: { date: true, userId: true },
    orderBy: { createdAt: "asc" },
  });

  const byDate = new Map<string, string[]>();
  for (const entry of allEntries) {
    const dateKey = entry.date.toISOString().slice(0, 10);
    const userIds = byDate.get(dateKey);
    if (userIds) {
      userIds.push(entry.userId);
    } else {
      byDate.set(dateKey, [entry.userId]);
    }
  }

  const firstOfDayUserIds = new Set<string>();
  const lastOfDayUserIds = new Set<string>();
  for (const userIds of byDate.values()) {
    firstOfDayUserIds.add(userIds[0]);
    lastOfDayUserIds.add(userIds[userIds.length - 1]);
  }

  return { firstOfDayUserIds, lastOfDayUserIds };
}
