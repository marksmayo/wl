import "server-only";
import { prisma } from "@/lib/prisma";
import { getLeaderboardData } from "@/lib/leaderboard";
import { evaluateAndAwardBadges } from "./evaluate";

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

  // Reconstruct the best (lowest) rank each user has ever held by replaying
  // the same forward-filled % series the live leaderboard chart uses, one
  // historical day at a time — not just whatever their rank happens to be
  // right now.
  const { chartData, participants } = await getLeaderboardData();
  const bestRankEver = new Map<string, number>();
  for (const row of chartData) {
    const dayStandings = participants
      .map((p) => ({ userId: p.id, value: row[p.id] }))
      .filter((e): e is { userId: string; value: number } => typeof e.value === "number")
      .sort((a, b) => a.value - b.value);

    dayStandings.forEach((entry, i) => {
      const rank = i + 1;
      if (rank > 3) return;
      const prevBest = bestRankEver.get(entry.userId);
      if (prevBest === undefined || rank < prevBest) {
        bestRankEver.set(entry.userId, rank);
      }
    });
  }

  const results: BackfillResult[] = [];

  for (const user of users) {
    const weighIns = await prisma.weighIn.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      select: { date: true, weight: true },
    });

    const rank = bestRankEver.get(user.id) ?? null;
    let newBadges: Awaited<ReturnType<typeof evaluateAndAwardBadges>> = [];

    if (weighIns.length > 0) {
      const everGained = weighIns.some((w, i) => i > 0 && w.weight > weighIns[i - 1].weight);
      newBadges = await evaluateAndAwardBadges({
        userId: user.id,
        rank,
        afterWeighIn: {
          weighInDates: weighIns.map((w) => w.date.toISOString().slice(0, 10)),
          firstWeight: weighIns[0].weight,
          latestWeight: weighIns[weighIns.length - 1].weight,
          previousWeight:
            weighIns.length > 1 ? weighIns[weighIns.length - 2].weight : null,
          everGained,
        },
      });
    } else if (rank !== null) {
      newBadges = await evaluateAndAwardBadges({ userId: user.id, rank });
    }

    if (newBadges.length > 0) {
      results.push({ userId: user.id, fullName: user.fullName, newBadges: newBadges.map((b) => b.id) });
    }
  }

  return results;
}
