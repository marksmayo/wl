import type { ChartRow } from "@/lib/leaderboard";

/**
 * Reconstructs the best (lowest) rank each user has ever held by replaying
 * the same forward-filled % series the leaderboard chart uses, one
 * historical day at a time — not just whatever a user's rank happens to be
 * right now. Pure/sync: callers pass in data they already fetched from
 * getLeaderboardData() rather than this re-querying it.
 */
export function computeBestRankEver(
  chartData: ChartRow[],
  participants: { id: string }[]
): Map<string, number> {
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

  return bestRankEver;
}
