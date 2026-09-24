"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartRow, LeaderboardEntry } from "@/lib/leaderboard";
import {
  RACE_DURATION_MS,
  RACE_STAGGER_MS,
  lineDrawFraction,
  racePoints,
  raceValueAt,
  type RacePoint,
} from "@/components/charts/lineDrawTiming";
import { recordRaceReplayAction } from "@/app/actions/badges";
import { announceBadges } from "@/lib/badges/events";

const ROW_HEIGHT = 40;

type Participant = { id: string; fullName: string };

type Row = {
  userId: string;
  name: string;
  progress: number;
  goalPercent: number;
};

type RowSeries = {
  firstIdx: number;
  /** Real (non-forward-filled) data points to interpolate between — see racePoints/raceValueAt. */
  points: RacePoint[];
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
 * competition day by day: each bar's width at any moment is that person's
 * goal progress as of the date the race has reached, and rows slide past
 * each other as people take (or lose) the lead — a small "race" that
 * finishes on today's real standings. A Replay button lets you watch it
 * again.
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
        firstIdx: firstIdx === -1 ? chartData.length - 1 : firstIdx,
        points: racePoints(values),
        staggerIndex: staggerIndexById.get(row.userId) ?? 0,
      });
    }
    return map;
  }, [chartData, participants, finalRows]);

  const canAnimate = animate && chartData !== undefined && chartData.length > 1;
  const lastIdx = chartData ? chartData.length - 1 : 0;
  const [replayToken, setReplayToken] = useState(0);

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
    // Anchor the clock to the first animation frame, not to mount, so a busy
    // main thread right after hydration delays the race instead of making it
    // skip ahead. Re-runs from scratch whenever replayToken changes.
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      let allDone = true;
      let leadFraction = 0;

      const progress = finalRows.map((row) => {
        const series = seriesByUser.get(row.userId);
        if (!series) return row.progress;
        if (elapsed < series.staggerIndex * RACE_STAGGER_MS + RACE_DURATION_MS) {
          allDone = false;
        }
        const f = lineDrawFraction(elapsed, series.staggerIndex, RACE_DURATION_MS, RACE_STAGGER_MS);
        leadFraction = Math.max(leadFraction, f);
        // The line spans this person's first weigh-in through the last date.
        // A continuous (non-rounded) position, interpolated between the real
        // data points either side of it, so the bar glides smoothly through
        // the flat forward-filled stretches instead of sitting still and
        // then snapping the moment the next real entry's day arrives.
        const exactIdx = series.firstIdx + f * (lastIdx - series.firstIdx);
        const raw = raceValueAt(series.points, exactIdx);
        // Two decimals: the labels round anyway, and it keeps re-renders to a
        // few hundred per bar over the whole animation instead of one a frame.
        return Math.round((raw ?? 0) * 100) / 100;
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
  }, [canAnimate, finalRows, seriesByUser, lastIdx, replayToken]);

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
      {(asOfLabel || canAnimate) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {canAnimate ? (
            <button
              type="button"
              onClick={() => {
                setReplayToken((t) => t + 1);
                recordRaceReplayAction("goalProgress").then(announceBadges);
              }}
              className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-white/25 hover:text-foreground"
            >
              ↻ Replay
            </button>
          ) : (
            <span />
          )}
          {asOfLabel && (
            <p className="font-mono text-xs tabular-nums text-muted" aria-live="off">
              As of {asOfLabel}
            </p>
          )}
        </div>
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
            title={`${row.progress.toFixed(2)}% of the way to a ${row.goalPercent}% goal`}
          >
            <div className="w-24 shrink-0 truncate text-xs text-muted sm:w-28">{row.name}</div>
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.progress}%`,
                  backgroundColor: colorMap[row.userId],
                  transition: "width 100ms linear",
                }}
              />
            </div>
            <div className="w-14 shrink-0 text-right font-mono text-xs text-muted">
              {row.progress.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
