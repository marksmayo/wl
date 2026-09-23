import type { ReactNode } from "react";

/**
 * Building blocks for the route-level loading.tsx files. Purely
 * presentational: they mirror each page's layout closely enough that the
 * real content slots in without the page jumping around.
 */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`glass rounded-2xl p-6 ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}

export function SkeletonHeading({ width = "w-48" }: { width?: string }) {
  return (
    <div>
      <SkeletonLine className={`h-9 ${width}`} />
      <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />
    </div>
  );
}

export function SkeletonChart({ className = "h-80 sm:h-96" }: { className?: string }) {
  return (
    <SkeletonCard>
      <SkeletonLine className="h-6 w-44" />
      <SkeletonLine className={`mt-4 w-full rounded-xl ${className}`} />
    </SkeletonCard>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonLine className="h-8 w-8 rounded-full" />
          <SkeletonLine className="h-4 flex-1" />
          <SkeletonLine className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTileGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
