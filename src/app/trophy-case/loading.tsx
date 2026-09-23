import { SkeletonCard, SkeletonHeading, SkeletonTileGrid } from "@/components/Skeleton";

export default function TrophyCaseLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Loading trophy case"
    >
      <SkeletonHeading width="w-48" />
      <div className="mt-8">
        <SkeletonCard>
          <SkeletonTileGrid />
        </SkeletonCard>
      </div>
    </main>
  );
}
