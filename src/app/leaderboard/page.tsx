import { verifySession } from "@/lib/dal";
import { getLeaderboardData } from "@/lib/leaderboard";
import { buildColorMap } from "@/lib/chartColors";
import { competitionStatus, daysRemaining, daysUntilStart } from "@/lib/competition";
import { WeightChart } from "@/components/WeightChart";
import { RankingsTable } from "@/components/RankingsTable";
import { AnimatedIn } from "@/components/AnimatedIn";

export default async function LeaderboardPage() {
  const session = await verifySession();
  const { chartData, entries, participants } = await getLeaderboardData();
  const colorMap = buildColorMap(participants.map((p) => p.id));
  const status = competitionStatus();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <AnimatedIn>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted">
            {status === "active" && `${daysRemaining()} days remaining · `}
            {status === "upcoming" && `Starts in ${daysUntilStart()} days · `}
            Ranked by % weight change since each person&apos;s first weigh-in.
          </p>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.1} className="mt-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Everyone&apos;s progress</h2>
          <div className="mt-4">
            <WeightChart data={chartData} participants={participants} colorMap={colorMap} />
          </div>
        </div>
      </AnimatedIn>

      <AnimatedIn delay={0.2} className="mt-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Standings</h2>
          <div className="mt-4">
            <RankingsTable entries={entries} currentUserId={session.userId} colorMap={colorMap} />
          </div>
        </div>
      </AnimatedIn>
    </main>
  );
}
