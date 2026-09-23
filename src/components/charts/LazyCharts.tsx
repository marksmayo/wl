"use client";

import dynamic from "next/dynamic";
import type { ComponentProps, CSSProperties } from "react";
import type { WeightChart } from "@/components/WeightChart";
import type { GoalProgressChart } from "@/components/GoalProgressChart";
import type { ProjectionChart } from "@/components/ProjectionChart";

/**
 * Recharts is ~390 KB of JavaScript that nothing above the fold depends on.
 * These wrappers split it into its own chunk and only fetch it in the
 * browser after hydration (`ssr: false`), so the page's HTML and the rest
 * of its JS aren't held up behind the charting library. The charts already
 * measure their container client-side, so nothing is lost by skipping SSR.
 */

function ChartPlaceholder({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`skeleton w-full rounded-xl ${className ?? ""}`} style={style} aria-hidden="true" />
  );
}

export const LazyWeightChart = dynamic<ComponentProps<typeof WeightChart>>(
  () => import("@/components/WeightChart").then((m) => m.WeightChart),
  { ssr: false, loading: () => <ChartPlaceholder className="h-80 sm:h-96" /> }
);

export const LazyProjectionChart = dynamic<ComponentProps<typeof ProjectionChart>>(
  () => import("@/components/ProjectionChart").then((m) => m.ProjectionChart),
  { ssr: false, loading: () => <ChartPlaceholder className="h-72 sm:h-80" /> }
);

export const LazyGoalProgressChart = dynamic<ComponentProps<typeof GoalProgressChart>>(
  () => import("@/components/GoalProgressChart").then((m) => m.GoalProgressChart),
  { ssr: false, loading: () => <ChartPlaceholder style={{ height: 160 }} /> }
);
