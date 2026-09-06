import "server-only";
import { prisma } from "@/lib/prisma";
import {
  COMPETITION_START,
  COMPETITION_END,
  COMPETITION_END_DATE,
  competitionStatus,
  todayDateKey,
} from "@/lib/competition";

export type UserSeriesPoint = {
  dateKey: string;
  weight: number;
  percentChange: number;
};

export type LeaderboardEntry = {
  userId: string;
  fullName: string;
  unit: string;
  hideWeight: boolean;
  startWeight: number | null;
  currentWeight: number | null;
  percentChange: number | null;
  predictedFinalPercent: number | null;
  predictedFinalWeight: number | null;
  entryCount: number;
  rank: number | null;
  badgeCount: number;
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
      hideWeight: true,
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

  const badgeCounts = await prisma.userBadge.groupBy({
    by: ["userId"],
    _count: { badgeId: true },
  });
  const badgeCountByUser = new Map(badgeCounts.map((b) => [b.userId, b._count.badgeId]));

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
    const first = series?.[0];
    const last = series?.[series.length - 1];

    // Extrapolate each person's own daily rate of change (first entry to
    // latest) across the full span to competition end — a rough "if this
    // pace holds" projection, not a re-ranking signal.
    let predictedFinalPercent: number | null = null;
    let predictedFinalWeight: number | null = null;
    if (first && last && series && series.length >= 2) {
      const firstMs = new Date(`${first.dateKey}T00:00:00.000Z`).getTime();
      const lastMs = new Date(`${last.dateKey}T00:00:00.000Z`).getTime();
      const daysElapsed = (lastMs - firstMs) / 86_400_000;
      if (daysElapsed > 0) {
        const dailyRate = last.percentChange / daysElapsed;
        const daysFirstToEnd = (COMPETITION_END_DATE.getTime() - firstMs) / 86_400_000;
        predictedFinalPercent = dailyRate * daysFirstToEnd;
        // Derived from the same % projection (not a separate calculation)
        // so the two numbers always agree with each other.
        predictedFinalWeight = first.weight * (1 + predictedFinalPercent / 100);
      }
    }

    return {
      userId: user.id,
      fullName: user.fullName,
      unit: user.unit,
      hideWeight: user.hideWeight,
      startWeight: first?.weight ?? null,
      currentWeight: last?.weight ?? null,
      percentChange: last?.percentChange ?? null,
      predictedFinalPercent,
      predictedFinalWeight,
      entryCount: series?.length ?? 0,
      rank: null,
      badgeCount: badgeCountByUser.get(user.id) ?? 0,
    };
  });

  const ranked = entries
    .filter((e) => e.percentChange !== null)
    .sort((a, b) => (a.percentChange as number) - (b.percentChange as number));

  ranked.forEach((e, i) => {
    e.rank = i + 1;
  });

  const unranked = entries.filter((e) => e.percentChange === null);

  // Only meaningful during the active window — before it starts nobody is
  // expected to have logged anything yet, and after it ends there's no
  // "today" to chase. This UTC-based version is only the SSR/no-JS
  // fallback — the client corrects it to the visitor's real local date
  // (see LiveMissingToday), since AU/NZ run 10-13 hours ahead of UTC.
  const todayKey = todayDateKey();
  const missingToday =
    competitionStatus() === "active"
      ? users
          .filter((user) => !user.weighIns.some((w) => dateToKey(w.date) === todayKey))
          .map((user) => ({ id: user.id, fullName: user.fullName }))
      : [];

  // Every user's logged date-keys, so the client can redo the "who's
  // missing today" check against the visitor's own local date.
  const roster = users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    loggedDates: user.weighIns.map((w) => dateToKey(w.date)),
  }));

  return {
    chartData,
    entries: [...ranked, ...unranked],
    participants: users.map((u) => ({ id: u.id, fullName: u.fullName })),
    missingToday,
    roster,
  };
}
