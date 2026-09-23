import "server-only";
import { prisma } from "@/lib/prisma";

type BadgeCount = { userId: string; badgeCount: number };

/**
 * The viewer's snapshot of everyone's badge counts as of their last
 * leaderboard view. Read this in parallel with the leaderboard data, diff
 * with `diffBadgeCounts`, then persist the new snapshot from an `after()`
 * so the write never delays the response.
 */
export async function getLastSeenBadgeCounts(viewerId: string): Promise<Record<string, number>> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { lastSeenBadgeCounts: true },
  });
  return (viewer?.lastSeenBadgeCounts ?? {}) as Record<string, number>;
}

/**
 * Which competitors' badge counts have changed since the viewer's snapshot.
 *
 * A viewer's very first leaderboard visit has no snapshot to compare
 * against — rather than treat "0 seen before" as a change for every
 * competitor with any badges, nothing is reported as changed; the visit
 * just establishes the baseline.
 */
export function diffBadgeCounts(
  lastSeen: Record<string, number>,
  currentCounts: BadgeCount[]
): Set<string> {
  const changed = new Set<string>();
  if (Object.keys(lastSeen).length === 0) return changed;
  for (const { userId, badgeCount } of currentCounts) {
    if (badgeCount !== (lastSeen[userId] ?? 0)) {
      changed.add(userId);
    }
  }
  return changed;
}

export async function saveBadgeCountSnapshot(viewerId: string, currentCounts: BadgeCount[]) {
  const newSnapshot = Object.fromEntries(currentCounts.map((c) => [c.userId, c.badgeCount]));
  await prisma.user.update({
    where: { id: viewerId },
    data: { lastSeenBadgeCounts: newSnapshot },
  });
}
