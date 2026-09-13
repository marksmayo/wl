import "server-only";
import { prisma } from "@/lib/prisma";
import { BADGES, type BadgeDefinition } from "./definitions";

export type TrophyCaseEntry = BadgeDefinition & {
  holders: number;
  percent: number;
};

/**
 * Server-wide badge rarity: how many competitors (and what %) hold each
 * badge, sorted rarest-first. Distinct from the personal /badges gallery,
 * which is about one person's own earned/locked state.
 */
export async function getTrophyCaseStats(): Promise<{
  totalUsers: number;
  entries: TrophyCaseEntry[];
}> {
  const [totalUsers, counts] = await Promise.all([
    prisma.user.count(),
    prisma.userBadge.groupBy({ by: ["badgeId"], _count: { badgeId: true } }),
  ]);

  const holdersByBadgeId = new Map(counts.map((c) => [c.badgeId, c._count.badgeId]));

  const entries: TrophyCaseEntry[] = BADGES.map((badge) => {
    const holders = holdersByBadgeId.get(badge.id) ?? 0;
    return {
      ...badge,
      holders,
      percent: totalUsers > 0 ? (holders / totalUsers) * 100 : 0,
    };
  });

  entries.sort((a, b) => a.holders - b.holders || a.name.localeCompare(b.name));

  return { totalUsers, entries };
}
