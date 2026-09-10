import type { ChartRow } from "@/lib/leaderboard";

/**
 * Reconstructs every rank (1..maxRank) each user has ever held by replaying
 * the same forward-filled % series the leaderboard chart uses, one
 * historical day at a time — not just whatever a user's rank happens to be
 * right now. A user keeps credit for reaching #4 even after later climbing
 * to #1, since "ever achieved" badges are permanent once earned. Pure/sync:
 * callers pass in data they already fetched from getLeaderboardData()
 * rather than this re-querying it.
 */
export function computeRanksEverHeld(
  chartData: ChartRow[],
  participants: { id: string }[],
  maxRank = 9
): Map<string, Set<number>> {
  const ranksEverHeld = new Map<string, Set<number>>();

  for (const row of chartData) {
    const dayStandings = participants
      .map((p) => ({ userId: p.id, value: row[p.id] }))
      .filter((e): e is { userId: string; value: number } => typeof e.value === "number")
      .sort((a, b) => a.value - b.value);

    dayStandings.forEach((entry, i) => {
      const rank = i + 1;
      if (rank > maxRank) return;
      if (!ranksEverHeld.has(entry.userId)) {
        ranksEverHeld.set(entry.userId, new Set());
      }
      ranksEverHeld.get(entry.userId)!.add(rank);
    });
  }

  return ranksEverHeld;
}
