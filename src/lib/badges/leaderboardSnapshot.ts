import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Compares each competitor's current badge count against the viewer's
 * last-seen snapshot (recorded the last time they viewed the leaderboard),
 * returns the set of userIds whose count has changed since, then persists
 * the current counts as the new snapshot for next time.
 *
 * A viewer's very first leaderboard visit has no snapshot to compare
 * against — rather than treat "0 seen before" as a change for every
 * competitor with any badges, nothing is reported as changed; the visit
 * just establishes the baseline.
 */
export async function getChangedBadgeCounts(
  viewerId: string,
  currentCounts: { userId: string; badgeCount: number }[]
): Promise<Set<string>> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { lastSeenBadgeCounts: true },
  });

  const lastSeen = (viewer?.lastSeenBadgeCounts ?? {}) as Record<string, number>;
  const hasPriorSnapshot = Object.keys(lastSeen).length > 0;

  const changed = new Set<string>();
  if (hasPriorSnapshot) {
    for (const { userId, badgeCount } of currentCounts) {
      if (badgeCount !== (lastSeen[userId] ?? 0)) {
        changed.add(userId);
      }
    }
  }

  const newSnapshot = Object.fromEntries(currentCounts.map((c) => [c.userId, c.badgeCount]));
  await prisma.user.update({
    where: { id: viewerId },
    data: { lastSeenBadgeCounts: newSnapshot },
  });

  return changed;
}
