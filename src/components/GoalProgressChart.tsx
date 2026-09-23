"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartRow, LeaderboardEntry } from "@/lib/leaderboard";
import {
  LINE_DRAW_DURATION_MS,
  LINE_DRAW_STAGGER_MS,
  lineDrawFraction,
} from "@/components/charts/lineDrawTiming";

const ROW_HEIGHT = 40;

type Participant = { id: string; fullName: string };

type Row = {
  userId: string;
  name: string;
  progress: number;
  goalPercent: number;
};

type RowSeries = {
  /** Goal progress (0-100) at each chartData index; null before the first weigh-in. */
  values: (number | null)[];
  firstIdx: number;
  /** Position in the WeightChart's participants array — drives the stagger. */
  staggerIndex: number;
};

function goalProgress(percentChange: number, goalPercent: number): number {
  const lossPercent = Math.max(0, -percentChange);
  return Math.min(100, Math.max(0, (lossPercent / goalPercent) * 100));
}

/**
 * Horizontal meter bars of how far each person with a goal has gotten
 * toward it.
 *
 * With `animate` (and `chartData` + `participants`), the bars replay the
 * competition in step with the WeightChart's left-to-right line draw-in:
 * each bar's width at any moment is that person's goal progress as of the
 * date their line has reached, and rows slide past each other as people
 * take (or lose) the lead — a small "race" that finishes on today's real
 * standings.
 */
export function GoalProgressChart({
  entries,
  colorMap,
  chartData,
  participants,
  animate = false,
}: {
  entries: LeaderboardEntry[];
  colorMap: Record<string, string>;
  chartData?: ChartRow[];
  participants?: Participant[];
  animate?: boolean;
}) {
  const finalRows: Row[] = useMemo(
    () =>
      entries
        .filter(
          (e): e is LeaderboardEntry & { goalProgressPercent: number; goalPercent: number } =>
            e.goalProgressPercent !== null && e.goalPercent !== null
        )
        .map((e) => ({
          userId: e.userId,
          name: e.fullName,
          progress: Math.min(100, Math.max(0, e.goalProgressPercent)),
          goalPercent: e.goalPercent,
        }))
        .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name)),
    [entries]
  );

  // Per-row progress history, derived from the same forward-filled rows the
  // line chart draws, so the two views agree at every date.
  const seriesByUser = useMemo(() => {
    const map = new Map<string, RowSeries>();
    if (!chartData || chartData.length === 0) return map;
    const staggerIndexById = new Map((participants ?? []).map((p, i) => [p.id, i]));
    for (const row of finalRows) {
      const values = chartData.map((r) => {
        const pct = r[row.userId];
        return typeof pct === "number" ? goalProgress(pct, row.goalPercent) : null;
      });
      const firstIdx = values.findIndex((v) => v !== null);
      map.set(row.userId, {
        values,
        firstIdx: firstIdx === -1 ? chartData.length - 1 : firstIdx,
        staggerIndex: staggerIndexById.get(row.userId) ?? 0,
      });
    }
    return map;
  }, [chartData, participants, finalRows]);

  const canAnimate = animate && chartData !== undefined && chartData.length > 1;
  const lastIdx = chartData ? chartData.length - 1 : 0;

  // Start empty when animating (the lines haven't been drawn yet either),
  // otherwise show the final values straight away.
  const [displayed, setDisplayed] = useState<{ progress: number[]; asOfIdx: number }>(() => ({
    progress: finalRows.map((r) => (canAnimate ? 0 : r.progress)),
    asOfIdx: canAnimate ? 0 : lastIdx,
  }));

  useEffect(() => {
    if (!canAnimate) return;

    let frame = 0;
    let lastKey = "";
    // Anchor the clock to the first animation frame, not to mount: Recharts
    // does the same for the line draw-in, and it means a busy main thread
    // right after hydration delays both charts equally instead of making the
    // bars skip ahead.
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      let allDone = true;
      let leadFraction = 0;

      const progress = finalRows.map((row) => {
        const series = seriesByUser.get(row.userId);
        if (!series) return row.progress;
        if (elapsed < series.staggerIndex * LINE_DRAW_STAGGER_MS + LINE_DRAW_DURATION_MS) {
          allDone = false;
        }
        const f = lineDrawFraction(elapsed, series.staggerIndex);
        leadFraction = Math.max(leadFraction, f);
        // The line spans this person's first weigh-in through the last date.
        const idx = series.firstIdx + Math.round(f * (lastIdx - series.firstIdx));
        // Whole percents: the labels round anyway, and it keeps re-renders to
        // ~100 per bar over the whole animation instead of one per frame.
        return Math.round(series.values[idx] ?? 0);
      });

      if (allDone) {
        setDisplayed({ progress: finalRows.map((r) => r.progress), asOfIdx: lastIdx });
        return;
      }
      const asOfIdx = Math.round(leadFraction * lastIdx);
      // Only touch React state when something visible actually changed.
      const key = `${progress.join(",")}|${asOfIdx}`;
      if (key !== lastKey) {
        lastKey = key;
        setDisplayed({ progress, asOfIdx });
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [canAnimate, finalRows, seriesByUser, lastIdx]);

  if (finalRows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No one has set a goal yet.
      </div>
    );
  }

  // Re-sorted by *current* progress every tick (not the fixed final order)
  // so rows visibly overtake each other as the race plays out.
  const rows: Row[] = finalRows
    .map((row, i) => ({ ...row, progress: displayed.progress[i] ?? row.progress }))
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));
  const rankByUserId = new Map(rows.map((row, i) => [row.userId, i]));
  const asOfLabel = chartData?.[displayed.asOfIdx]?.label;

  return (
    <div className="w-full">
      {asOfLabel && (
        <p className="mb-2 text-right font-mono text-xs tabular-nums text-muted" aria-live="off">
          As of {asOfLabel}
        </p>
      )}
      <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
        {rows.map((row) => (
          <div
            key={row.userId}
            className="absolute inset-x-0 flex items-center gap-3"
            style={{
              height: ROW_HEIGHT,
              transform: `translateY(${(rankByUserId.get(row.userId) ?? 0) * ROW_HEIGHT}px)`,
              transition: "transform 400ms ease",
            }}
            title={`${Math.round(row.progress)}% of the way to a ${row.goalPercent}% goal`}
          >
            <div className="w-24 shrink-0 truncate text-xs text-muted sm:w-28">{row.name}</div>
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.progress}%`,
                  backgroundColor: colorMap[row.userId],
                  transition: "width 120ms linear",
                }}
              />
            </div>
            <div className="w-10 shrink-0 text-right font-mono text-xs text-muted">
              {Math.round(row.progress)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
