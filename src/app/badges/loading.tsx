import { SkeletonCard, SkeletonHeading, SkeletonTileGrid } from "@/components/Skeleton";

export default function BadgesLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Loading badges"
    >
      <SkeletonHeading width="w-40" />
      <div className="mt-8">
        <SkeletonCard>
          <SkeletonTileGrid />
        </SkeletonCard>
      </div>
    </main>
  );
}
