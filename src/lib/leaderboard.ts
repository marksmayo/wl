import "server-only";
import { prisma } from "@/lib/prisma";
import { COMPETITION_START, COMPETITION_END } from "@/lib/competition";

export type UserSeriesPoint = {
  dateKey: string;
  weight: number;
  percentChange: number;
};

export type LeaderboardEntry = {
  userId: string;
  fullName: string;
  unit: string;
  startWeight: number | null;
  currentWeight: number | null;
  percentChange: number | null;
  entryCount: number;
  rank: number | null;
};

export type ChartRow = {
  dateKey: string;
  label: string;
  [userId: string]: string | number | null;
};

function dateToKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Loads every user's weigh-ins inside the competition window and derives:
 * - a per-user % change series (baseline = each user's first logged weight)
 * - a combined, forward-filled chart dataset for a multi-line graph
 * - ranked standings by most recent % change (most weight lost = rank 1)
 */
export async function getLeaderboardData() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      unit: true,
      weighIns: {
        where: {
          date: {
            gte: new Date(`${COMPETITION_START}T00:00:00.000Z`),
            lte: new Date(`${COMPETITION_END}T00:00:00.000Z`),
          },
        },
        orderBy: { date: "asc" },
        select: { date: true, weight: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const allDateKeys = new Set<string>();
  const seriesByUser = new Map<string, UserSeriesPoint[]>();

  for (const user of users) {
    if (user.weighIns.length === 0) continue;
    const baseline = user.weighIns[0].weight;
    const series: UserSeriesPoint[] = user.weighIns.map((w) => {
      const dateKey = dateToKey(w.date);
      allDateKeys.add(dateKey);
      return {
        dateKey,
        weight: w.weight,
        percentChange: ((w.weight - baseline) / baseline) * 100,
      };
    });
    seriesByUser.set(user.id, series);
  }

  const sortedDateKeys = Array.from(allDateKeys).sort();

  const chartData: ChartRow[] = sortedDateKeys.map((dateKey) => {
    const row: ChartRow = {
      dateKey,
      label: new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    };
    for (const user of users) {
      const series = seriesByUser.get(user.id);
      if (!series) {
        row[user.id] = null;
        continue;
      }
      // Forward-fill: use the latest known value on or before this date;
      // leave null before the user's first entry so the line starts later.
      let value: number | null = null;
      for (const point of series) {
        if (point.dateKey > dateKey) break;
        value = point.percentChange;
      }
      row[user.id] = value;
    }
    return row;
  });

  const entries: LeaderboardEntry[] = users.map((user) => {
    const series = seriesByUser.get(user.id);
    const last = series?.[series.length - 1];
    return {
      userId: user.id,
      fullName: user.fullName,
      unit: user.unit,
      startWeight: series?.[0]?.weight ?? null,
      currentWeight: last?.weight ?? null,
      percentChange: last?.percentChange ?? null,
      entryCount: series?.length ?? 0,
      rank: null,
    };
  });

  const ranked = entries
    .filter((e) => e.percentChange !== null)
    .sort((a, b) => (a.percentChange as number) - (b.percentChange as number));

  ranked.forEach((e, i) => {
    e.rank = i + 1;
  });

  const unranked = entries.filter((e) => e.percentChange === null);

  return {
    chartData,
    entries: [...ranked, ...unranked],
    participants: users.map((u) => ({ id: u.id, fullName: u.fullName })),
  };
}
