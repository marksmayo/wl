import Link from "next/link";
import { getCurrentUser, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getLeaderboardData } from "@/lib/leaderboard";
import { buildColorMap } from "@/lib/chartColors";
import {
  COMPETITION_START,
  COMPETITION_END,
  todayDateKey,
  clampToCompetitionWindow,
  competitionStatus,
  daysRemaining,
} from "@/lib/competition";
import { formatPercent, formatWeight } from "@/lib/format";
import { WeighInForm } from "@/components/WeighInForm";
import { LazyWeightChart, LazyProjectionChart } from "@/components/charts/LazyCharts";
import { AnimatedIn, AnimatedStagger } from "@/components/AnimatedIn";
import { CountUp } from "@/components/CountUp";
import { RankMedal } from "@/components/RankMedal";
import { LiveCompetitionStatus } from "@/components/LiveCompetitionStatus";
import { BadgeAnnouncer } from "@/components/BadgeAnnouncer";
import { evaluateAndAwardBadges, loadBadgeContext } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";
import { computeRanksEverHeld } from "@/lib/badges/rankHistory";
import { buildAfterWeighInContext } from "@/lib/badges/weighinContext";
import { currentStreak } from "@/lib/badges/streaks";
import { LiveStreakFlame } from "@/components/LiveStreakFlame";

export default async function DashboardPage() {
  // The session cookie already carries the user id, so every read below —
  // including the user row itself — goes out in a single parallel batch.
  const session = await verifySession();
  const [user, myWeighIns, { chartData, entries, participants }, device, badgeContext] =
    await Promise.all([
      getCurrentUser(),
      prisma.weighIn.findMany({
        where: { userId: session.userId },
        orderBy: { date: "asc" },
        select: { date: true, weight: true },
      }),
      getLeaderboardData(),
      detectDevice(),
      loadBadgeContext(session.userId),
    ]);

  const today = todayDateKey();
  const defaultDate = clampToCompetitionWindow(today)
    ? today
    : today < COMPETITION_START
    ? COMPETITION_START
    : COMPETITION_END;

  const todaysEntry = myWeighIns.find(
    (w) => w.date.toISOString().slice(0, 10) === defaultDate
  );
  const latest = myWeighIns[myWeighIns.length - 1];
  const first = myWeighIns[0];
  const percentChange =
    first && latest ? ((latest.weight - first.weight) / first.weight) * 100 : null;

  const myEntry = entries.find((e) => e.userId === user.id);
  const myPercentSeries = first
    ? myWeighIns.map((w) => ({
        dateKey: w.date.toISOString().slice(0, 10),
        percentChange: ((w.weight - first.weight) / first.weight) * 100,
      }))
    : [];
  const colorMap = buildColorMap(participants.map((p) => p.id));
  const status = competitionStatus();
  const fallbackDays = status === "active" ? daysRemaining() : 0;

  // Re-derives every weigh-in-based badge from this user's full history
  // (not just today's submission) on every dashboard load — so anyone who
  // weighed in before the badge system existed catches up automatically,
  // no manual backfill needed. Cheap: myWeighIns/chartData/participants are
  // already fetched above for the page's own rendering.
  const ranksEverHeld = computeRanksEverHeld(chartData, participants);
  const newBadges = await evaluateAndAwardBadges({
    userId: user.id,
    context: badgeContext,
    recordVisit: true,
    device,
    ranksEverHeld: ranksEverHeld.get(user.id),
    goalPercent: user.goalPercent,
    afterWeighIn: buildAfterWeighInContext(myWeighIns),
  });

  // Today's visit is recorded after the response (see evaluateAndAwardBadges),
  // so count it here for the streak flame rather than re-reading the table.
  const visitDates = badgeContext.visitDates.includes(today)
    ? badgeContext.visitDates
    : [...badgeContext.visitDates, today];
  const fallbackStreak = currentStreak(visitDates, today);

  return (
    <main id="page-content" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <BadgeAnnouncer badgeIds={newBadges.map((b) => b.id)} />
      <AnimatedIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Hey {user.fullName.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-muted">
              <LiveCompetitionStatus
                fallbackStatus={status}
                fallbackDays={fallbackDays}
                variant="dashboard"
              />
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="rounded-full border border-border px-5 py-2 text-sm transition-colors hover:border-white/25"
          >
            View leaderboard →
          </Link>
        </div>
      </AnimatedIn>

      <AnimatedStagger className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4" itemSelector=".tile">
        <div className="tile glass relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-muted/40" aria-hidden="true" />
          <div className="pl-2 text-xs uppercase tracking-wide text-muted">Starting weight</div>
          <div className="mt-2 pl-2 text-2xl font-semibold">
            {first ? <CountUp value={first.weight} decimals={2} suffix={` ${user.unit}`} /> : "—"}
          </div>
        </div>
        <div className="tile glass relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-accent-2" aria-hidden="true" />
          <div className="pl-2 text-xs uppercase tracking-wide text-muted">Current weight</div>
          <div className="mt-2 pl-2 text-2xl font-semibold">
            {latest ? <CountUp value={latest.weight} decimals={2} suffix={` ${user.unit}`} /> : "—"}
          </div>
        </div>
        <div className="tile glass relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <span
            className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${
              percentChange !== null && percentChange <= 0 ? "bg-accent" : "bg-danger"
            }`}
            aria-hidden="true"
          />
          <div className="pl-2 text-xs uppercase tracking-wide text-muted">Change</div>
          <div
            className={`mt-2 flex items-baseline gap-1 pl-2 text-2xl font-semibold ${
              percentChange !== null && percentChange <= 0 ? "text-accent" : "text-danger"
            }`}
          >
            {percentChange !== null && (
              <span className="text-sm">{percentChange <= 0 ? "▼" : "▲"}</span>
            )}
            {formatPercent(percentChange)}
          </div>
        </div>
        <div className="tile glass relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <span
            className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${
              myEntry?.rank === 1
                ? "bg-[#ffd700]"
                : myEntry?.rank === 2
                ? "bg-[#c0c0c0]"
                : myEntry?.rank === 3
                ? "bg-[#cd7f32]"
                : "bg-muted/40"
            }`}
            aria-hidden="true"
          />
          <div className="pl-2 text-xs uppercase tracking-wide text-muted">Your rank</div>
          <div className="mt-2 flex items-center gap-2 pl-2">
            <RankMedal rank={myEntry?.rank ?? null} />
            <span className="text-sm text-muted">/ {entries.length}</span>
          </div>
        </div>
      </AnimatedStagger>

      {/* LiveStreakFlame (and StreakFlame within it) render nothing when the
          streak is 0 — not gated here, since the server's UTC fallback and
          the visitor's real local-date streak can briefly disagree right
          around midnight for AU/NZ visitors. */}
      <AnimatedIn delay={0.18} className="mt-6">
        <LiveStreakFlame visitDates={visitDates} fallbackStreak={fallbackStreak} />
      </AnimatedIn>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <AnimatedIn delay={0.1}>
          <WeighInForm
            unit={user.unit}
            defaultDate={defaultDate}
            defaultWeight={todaysEntry?.weight}
            weighIns={myWeighIns.map((w) => ({
              date: w.date.toISOString().slice(0, 10),
              weight: w.weight,
            }))}
          />
        </AnimatedIn>

        <AnimatedIn delay={0.15}>
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Your progress</h2>
            <p className="mt-1 text-sm text-muted">
              Weight change vs. your first logged weigh-in, as a percentage.
            </p>
            <div className="mt-4">
              <LazyWeightChart
                data={chartData}
                participants={
                  participants.find((p) => p.id === user.id) ? [{ id: user.id, fullName: user.fullName }] : []
                }
                colorMap={colorMap}
              />
            </div>
          </div>
        </AnimatedIn>
      </div>

      {myPercentSeries.length > 0 && myEntry && (
        <AnimatedIn delay={0.18} className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Projected outcome</h2>
            <p className="mt-1 text-sm text-muted">
              Three ways of extrapolating your own pace to the end of the competition — the dashed
              lines pick up where your actual progress (solid) leaves off.
            </p>
            <div className="mt-4">
              <LazyProjectionChart
                series={myPercentSeries}
                projections={{
                  straightLine: myEntry.projectedStraightLinePercent,
                  lastWeek: myEntry.projectedLastWeekPercent,
                  lastMonth: myEntry.projectedLastMonthPercent,
                }}
                endDateKey={COMPETITION_END}
              />
            </div>
          </div>
        </AnimatedIn>
      )}

      {myWeighIns.length > 0 && (
        <AnimatedIn delay={0.2} className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Your entries</h2>
            <div className="mt-4 overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {[...myWeighIns].reverse().map((w) => (
                    <tr key={w.date.toISOString()} className="border-t border-border">
                      <td className="py-2 text-muted">
                        {w.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="py-2">{formatWeight(w.weight, user.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedIn>
      )}
    </main>
  );
}
