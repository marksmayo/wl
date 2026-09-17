import "server-only";
import { prisma } from "@/lib/prisma";
import {
  COMPETITION_START,
  COMPETITION_END,
  COMPETITION_END_DATE,
  competitionStatus,
  todayDateKey,
  computeMissingList,
  computeWeighedInList,
} from "@/lib/competition";
import { LBS_PER_KG, CM_PER_INCH } from "@/lib/units";

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
  /** Straight-line-since-start, last-7-days, and last-30-days projections to competition end — see PROJECTION_MODELS. */
  projectedStraightLinePercent: number | null;
  projectedStraightLineWeight: number | null;
  projectedLastWeekPercent: number | null;
  projectedLastWeekWeight: number | null;
  projectedLastMonthPercent: number | null;
  projectedLastMonthWeight: number | null;
  entryCount: number;
  rank: number | null;
  badgeCount: number;
  goalPercent: number | null;
  /** 0-100, how far toward goalPercent this user's actual loss is so far. Null if no goal set. */
  goalProgressPercent: number | null;
  /** Derived from goalPercent + startWeight, regardless of whether the goal was originally entered as a % or a weight. Null if no goal or no first weigh-in yet. */
  goalTargetWeight: number | null;
  /** Null if no height on file yet. */
  bmi: number | null;
  hideBMI: boolean;
  /** Recent % change history (oldest to newest), for a small trend sparkline. */
  sparkline: number[];
};

export type ChartRow = {
  dateKey: string;
  label: string;
  [userId: string]: string | number | null;
};

function dateToKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateKeyMs(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00.000Z`).getTime();
}

export function computeBMI(weight: number, height: number, unit: string): number {
  const weightKg = unit === "kg" ? weight : weight / LBS_PER_KG;
  const heightCm = unit === "kg" ? height : height * CM_PER_INCH;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Average daily rate of change over just the trailing `windowDays` of a
// user's own history (not the whole competition), extrapolated to the
// competition end from wherever they are today — a "recent pace" read that
// reacts much faster than the since-the-start average.
function projectFromRecentWindow(series: UserSeriesPoint[], windowDays: number): number | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  const latestMs = dateKeyMs(latest.dateKey);
  const cutoffMs = latestMs - windowDays * 86_400_000;
  const windowPoints = series.filter((p) => dateKeyMs(p.dateKey) >= cutoffMs);
  const baseline = windowPoints[0];
  if (!baseline || baseline === latest) return null;

  const daysElapsed = (latestMs - dateKeyMs(baseline.dateKey)) / 86_400_000;
  if (daysElapsed <= 0) return null;

  const rate = (latest.percentChange - baseline.percentChange) / daysElapsed;
  const daysToEnd = (COMPETITION_END_DATE.getTime() - latestMs) / 86_400_000;
  return latest.percentChange + rate * daysToEnd;
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
      goalPercent: true,
      height: true,
      hideBMI: true,
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

    // Model 1: extrapolate each person's own daily rate of change (first
    // entry to latest) across the full span to competition end — a rough
    // "if this pace holds" projection, not a re-ranking signal.
    let projectedStraightLinePercent: number | null = null;
    let projectedStraightLineWeight: number | null = null;
    if (first && last && series && series.length >= 2) {
      const firstMs = dateKeyMs(first.dateKey);
      const lastMs = dateKeyMs(last.dateKey);
      const daysElapsed = (lastMs - firstMs) / 86_400_000;
      if (daysElapsed > 0) {
        const dailyRate = last.percentChange / daysElapsed;
        const daysFirstToEnd = (COMPETITION_END_DATE.getTime() - firstMs) / 86_400_000;
        projectedStraightLinePercent = dailyRate * daysFirstToEnd;
        // Derived from the same % projection (not a separate calculation)
        // so the two numbers always agree with each other.
        projectedStraightLineWeight = first.weight * (1 + projectedStraightLinePercent / 100);
      }
    }

    // Models 2 & 3: recent-pace projections, reacting only to the last
    // week/month of history instead of the whole competition average.
    const projectedLastWeekPercent = series ? projectFromRecentWindow(series, 7) : null;
    const projectedLastMonthPercent = series ? projectFromRecentWindow(series, 30) : null;
    // Same derive-from-percent approach as the straight-line model above —
    // every series percentChange is already relative to `first.weight`, so
    // the weight equivalent always agrees with its percent.
    const projectedLastWeekWeight =
      first && projectedLastWeekPercent !== null
        ? first.weight * (1 + projectedLastWeekPercent / 100)
        : null;
    const projectedLastMonthWeight =
      first && projectedLastMonthPercent !== null
        ? first.weight * (1 + projectedLastMonthPercent / 100)
        : null;

    // Progress toward their own goal, not the raw loss % — e.g. someone who
    // set a 10% goal and has lost 6% so far is 60% of the way there.
    let goalProgressPercent: number | null = null;
    if (user.goalPercent && user.goalPercent > 0) {
      const actualLossPercent = last ? Math.max(0, -last.percentChange) : 0;
      goalProgressPercent = Math.min(100, (actualLossPercent / user.goalPercent) * 100);
    }

    // The actual target weight implied by the goal, regardless of whether
    // it was originally entered as a % or a weight — always derived from
    // the canonical goalPercent against their real starting weight.
    const goalTargetWeight =
      user.goalPercent && user.goalPercent > 0 && first
        ? first.weight * (1 - user.goalPercent / 100)
        : null;

    const bmi = user.height && last ? computeBMI(last.weight, user.height, user.unit) : null;

    return {
      userId: user.id,
      fullName: user.fullName,
      unit: user.unit,
      hideWeight: user.hideWeight,
      startWeight: first?.weight ?? null,
      currentWeight: last?.weight ?? null,
      percentChange: last?.percentChange ?? null,
      projectedStraightLinePercent,
      projectedStraightLineWeight,
      projectedLastWeekPercent,
      projectedLastWeekWeight,
      projectedLastMonthPercent,
      projectedLastMonthWeight,
      entryCount: series?.length ?? 0,
      rank: null,
      badgeCount: badgeCountByUser.get(user.id) ?? 0,
      goalPercent: user.goalPercent,
      goalProgressPercent,
      goalTargetWeight,
      bmi,
      hideBMI: user.hideBMI,
      sparkline: series ? series.slice(-14).map((p) => p.percentChange) : [],
    };
  });

  const ranked = entries
    .filter((e) => e.percentChange !== null)
    .sort((a, b) => (a.percentChange as number) - (b.percentChange as number));

  ranked.forEach((e, i) => {
    e.rank = i + 1;
  });

  const unranked = entries.filter((e) => e.percentChange === null);

  // Every user's logged date-keys, so the client can redo the "who's
  // missing today" check (and the day-count) against the visitor's own
  // local date.
  const roster = users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    loggedDates: user.weighIns.map((w) => dateToKey(w.date)),
  }));

  // Only meaningful during the active window — before it starts nobody is
  // expected to have logged anything yet, and after it ends there's no
  // "today" to chase. This UTC-based version is only the SSR/no-JS
  // fallback — the client corrects it to the visitor's real local date
  // (see LiveMissingToday), since AU/NZ run 10-13 hours ahead of UTC.
  const todayKey = todayDateKey();
  const isActive = competitionStatus() === "active";
  const missingToday = isActive ? computeMissingList(roster, todayKey) : [];
  const weighedInToday = isActive ? computeWeighedInList(roster, todayKey) : [];

  return {
    chartData,
    entries: [...ranked, ...unranked],
    participants: users.map((u) => ({ id: u.id, fullName: u.fullName })),
    missingToday,
    weighedInToday,
    roster,
  };
}
