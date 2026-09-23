import { SkeletonCard, SkeletonChart, SkeletonHeading, SkeletonLine } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SkeletonHeading width="w-64" />
        <SkeletonLine className="h-9 w-40 rounded-full" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="mt-3 h-7 w-28" />
          </SkeletonCard>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <SkeletonCard>
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="mt-6 h-10 w-full" />
          <SkeletonLine className="mt-3 h-10 w-full" />
          <SkeletonLine className="mt-6 h-11 w-full rounded-full" />
        </SkeletonCard>
        <SkeletonChart />
      </div>
    </main>
  );
}
