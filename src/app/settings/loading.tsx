import { SkeletonCard, SkeletonHeading, SkeletonLine } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <SkeletonHeading width="w-36" />
      <div className="mt-8 flex flex-col gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonLine className="h-6 w-36" />
            <SkeletonLine className="mt-4 h-10 w-full" />
          </SkeletonCard>
        ))}
      </div>
    </main>
  );
}
