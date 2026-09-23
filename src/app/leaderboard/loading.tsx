import {
  SkeletonCard,
  SkeletonChart,
  SkeletonHeading,
  SkeletonLine,
  SkeletonRows,
} from "@/components/Skeleton";

export default function LeaderboardLoading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Loading leaderboard"
    >
      <SkeletonHeading width="w-56" />
      <div className="mt-8">
        <SkeletonChart />
      </div>
      <div className="mt-6">
        <SkeletonChart className="h-40" />
      </div>
      <div className="mt-6">
        <SkeletonCard>
          <SkeletonLine className="h-6 w-40" />
          <div className="mt-4">
            <SkeletonRows rows={5} />
          </div>
        </SkeletonCard>
      </div>
    </main>
  );
}
