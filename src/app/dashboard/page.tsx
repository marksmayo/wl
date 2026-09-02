import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
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
import { WeightChart } from "@/components/WeightChart";
import { AnimatedIn, AnimatedStagger } from "@/components/AnimatedIn";
import { CountUp } from "@/components/CountUp";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [myWeighIns, { chartData, entries, participants }] = await Promise.all([
    prisma.weighIn.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      select: { date: true, weight: true },
    }),
    getLeaderboardData(),
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
  const colorMap = buildColorMap(participants.map((p) => p.id));
  const status = competitionStatus();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <AnimatedIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Hey {user.fullName.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-muted">
              {status === "active"
                ? `${daysRemaining()} days left in the competition.`
                : status === "upcoming"
                ? "The competition hasn't started yet — log a baseline once it opens."
                : "The competition has ended. Great work!"}
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
        <div className="tile glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted">Starting weight</div>
          <div className="mt-2 text-2xl font-semibold">
            {first ? <CountUp value={first.weight} decimals={1} suffix={` ${user.unit}`} /> : "—"}
          </div>
        </div>
        <div className="tile glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted">Current weight</div>
          <div className="mt-2 text-2xl font-semibold">
            {latest ? <CountUp value={latest.weight} decimals={1} suffix={` ${user.unit}`} /> : "—"}
          </div>
        </div>
        <div className="tile glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted">Change</div>
          <div
            className={`mt-2 text-2xl font-semibold ${
              percentChange !== null && percentChange <= 0 ? "text-accent" : "text-danger"
            }`}
          >
            {formatPercent(percentChange)}
          </div>
        </div>
        <div className="tile glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted">Your rank</div>
          <div className="mt-2 text-2xl font-semibold">
            {myEntry?.rank ? `#${myEntry.rank}` : "—"}
            <span className="ml-1 text-sm font-normal text-muted">/ {entries.length}</span>
          </div>
        </div>
      </AnimatedStagger>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <AnimatedIn delay={0.1}>
          <WeighInForm
            unit={user.unit}
            defaultDate={defaultDate}
            defaultWeight={todaysEntry?.weight}
          />
        </AnimatedIn>

        <AnimatedIn delay={0.15}>
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Your progress</h2>
            <p className="mt-1 text-sm text-muted">
              Weight change vs. your first logged weigh-in, as a percentage.
            </p>
            <div className="mt-4">
              <WeightChart
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
