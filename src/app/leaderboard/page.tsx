import { after } from "next/server";
import { verifySession } from "@/lib/dal";
import { getLeaderboardData } from "@/lib/leaderboard";
import { buildColorMap } from "@/lib/chartColors";
import { competitionStatus, daysRemaining, daysUntilStart } from "@/lib/competition";
import {
  LazyWeightChart,
  LazyWeightLossRaceChart,
  LazyGoalProgressChart,
} from "@/components/charts/LazyCharts";
import { RankingsList } from "@/components/RankingsList";
import { LiveMissingToday } from "@/components/LiveMissingToday";
import { LiveWeighedInToday } from "@/components/LiveWeighedInToday";
import { AnimatedIn } from "@/components/AnimatedIn";
import { LiveCompetitionStatus } from "@/components/LiveCompetitionStatus";
import { BadgeAnnouncer } from "@/components/BadgeAnnouncer";
import { evaluateAndAwardBadges, loadBadgeContext } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";
import { computeRanksEverHeld } from "@/lib/badges/rankHistory";
import {
  getLastSeenBadgeCounts,
  diffBadgeCounts,
  saveBadgeCountSnapshot,
} from "@/lib/badges/leaderboardSnapshot";

export default async function LeaderboardPage() {
  const session = await verifySession();
  // Every read the page needs, in one round trip to the database.
  const [
    { chartData, entries, participants, missingToday, weighedInToday, roster },
    device,
    badgeContext,
    lastSeenBadgeCounts,
  ] = await Promise.all([
    getLeaderboardData(),
    detectDevice(),
    loadBadgeContext(session.userId),
    getLastSeenBadgeCounts(session.userId),
  ]);
  const colorMap = buildColorMap(participants.map((p) => p.id));
  const status = competitionStatus();
  const fallbackDays =
    status === "upcoming" ? daysUntilStart() : status === "active" ? daysRemaining() : 0;

  const ranksEverHeld = computeRanksEverHeld(chartData, participants);
  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    context: badgeContext,
    recordVisit: true,
    device,
    markViewedLeaderboard: true,
    ranksEverHeld: ranksEverHeld.get(session.userId),
  });

  // Reflect any badges just earned on THIS visit (e.g. Specials Board, a
  // fresh rank medal) in the viewer's own count before comparing/snapshotting
  // — otherwise their own row would look unchanged until their next visit.
  const displayEntries =
    newBadges.length > 0
      ? entries.map((e) =>
          e.userId === session.userId ? { ...e, badgeCount: e.badgeCount + newBadges.length } : e
        )
      : entries;

  const currentCounts = displayEntries.map((e) => ({ userId: e.userId, badgeCount: e.badgeCount }));
  const changedBadgeUserIds = diffBadgeCounts(lastSeenBadgeCounts, currentCounts);
  // Persist the new snapshot once the response is out the door.
  after(() => saveBadgeCountSnapshot(session.userId, currentCounts));

  return (
    <main id="page-content" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <BadgeAnnouncer badgeIds={newBadges.map((b) => b.id)} />
      <AnimatedIn>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted">
            <LiveCompetitionStatus
              fallbackStatus={status}
              fallbackDays={fallbackDays}
              variant="leaderboard"
            />
            Ranked by % weight change since each person&apos;s first weigh-in.
          </p>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.1} className="mt-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Everyone&apos;s progress</h2>
          <div className="mt-4">
            <LazyWeightChart data={chartData} participants={participants} colorMap={colorMap} animate />
          </div>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.13} className="mt-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Weight loss race</h2>
          <p className="mt-1 text-sm text-muted">
            Who&apos;s lost the most, as a percentage of their starting weight — replayed day by
            day.
          </p>
          <div className="mt-4">
            <LazyWeightLossRaceChart
              entries={displayEntries}
              colorMap={colorMap}
              chartData={chartData}
              participants={participants}
              animate
            />
          </div>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.16} className="mt-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Goal progress</h2>
          <p className="mt-1 text-sm text-muted">
            How far each person with a goal set has gotten toward it, as a percentage — replayed
            day by day.
          </p>
          <div className="mt-4">
            <LazyGoalProgressChart
              entries={displayEntries}
              colorMap={colorMap}
              chartData={chartData}
              participants={participants}
              animate
            />
          </div>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.2} className="mt-6">
        <LiveMissingToday roster={roster} fallbackPeople={missingToday} />
      </AnimatedIn>

      <AnimatedIn delay={0.25} className="mt-6">
        <LiveWeighedInToday roster={roster} fallbackPeople={weighedInToday} />
      </AnimatedIn>

      <AnimatedIn delay={0.3} className="mt-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Standings</h2>
          <div className="mt-4">
            <RankingsList
              entries={displayEntries}
              currentUserId={session.userId}
              colorMap={colorMap}
              changedBadgeUserIds={changedBadgeUserIds}
            />
          </div>
        </div>
      </AnimatedIn>
    </main>
  );
}
