import "server-only";
import { prisma } from "@/lib/prisma";
import { getLeaderboardData } from "@/lib/leaderboard";
import { evaluateAndAwardBadges } from "./evaluate";
import { computeBestRankEver } from "./rankHistory";
import { buildAfterWeighInContext } from "./weighinContext";

export type BackfillResult = {
  userId: string;
  fullName: string;
  newBadges: string[];
};

/**
 * Retroactively awards badges based on data that already existed before the
 * badge system shipped — weigh-in history and the leaderboard rank each
 * user has ever held. Safe to re-run: evaluateAndAwardBadges only ever adds
 * badges a user doesn't already have.
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
    select: { id: true, fullName: true },
    orderBy: { createdAt: "asc" },
  });

  const { chartData, participants } = await getLeaderboardData();
  const bestRankEver = computeBestRankEver(chartData, participants);

  const results: BackfillResult[] = [];

  for (const user of users) {
    const weighIns = await prisma.weighIn.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      select: { date: true, weight: true },
    });

    const newBadges = await evaluateAndAwardBadges({
      userId: user.id,
      rank: bestRankEver.get(user.id) ?? null,
      afterWeighIn: buildAfterWeighInContext(weighIns),
    });

    if (newBadges.length > 0) {
      results.push({ userId: user.id, fullName: user.fullName, newBadges: newBadges.map((b) => b.id) });
    }
  }

  return results;
}
