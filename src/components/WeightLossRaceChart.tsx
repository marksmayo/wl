"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartRow, LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent } from "@/lib/format";
import { RACE_DURATION_MS, RACE_STAGGER_MS, lineDrawFraction } from "@/components/charts/lineDrawTiming";
import { recordRaceReplayAction } from "@/app/actions/badges";
import { announceBadges } from "@/lib/badges/events";

const ROW_HEIGHT = 40;

type Participant = { id: string; fullName: string };

type Row = {
  userId: string;
  name: string;
  /** Raw % change since this person's first weigh-in (negative = loss). */
  percentChange: number;
};

type RowSeries = {
  /** Raw % change at each chartData index; null before the first weigh-in. */
  values: (number | null)[];
  firstIdx: number;
  /** Position in the WeightChart's participants array — drives the stagger. */
  staggerIndex: number;
};

/**
 * Horizontal bars of how much weight each person has lost so far, sized by
 * magnitude of loss (a gain still shows its real signed % as the label, just
 * with no bar to grow).
 *
 * With `animate` (and `chartData` + `participants`), the bars replay the
 * competition day by day, and rows slide past each other as people take (or
 * lose) the lead. A Replay button lets you watch it again.
 */
export function WeightLossRaceChart({
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
        .filter((e): e is LeaderboardEntry & { percentChange: number } => e.percentChange !== null)
        .map((e) => ({ userId: e.userId, name: e.fullName, percentChange: e.percentChange }))
        .sort((a, b) => a.percentChange - b.percentChange || a.name.localeCompare(b.name)),
    [entries]
  );

  // Widths are relative to the biggest loss anyone's reached by the end —
  // fixed once from the final standings so bars don't keep rescaling as the
  // animation plays.
  const domainMax = useMemo(
    () => Math.max(1, ...finalRows.map((r) => Math.max(0, -r.percentChange))),
    [finalRows]
  );

  const seriesByUser = useMemo(() => {
    const map = new Map<string, RowSeries>();
    if (!chartData || chartData.length === 0) return map;
    const staggerIndexById = new Map((participants ?? []).map((p, i) => [p.id, i]));
    for (const row of finalRows) {
      const values = chartData.map((r) => {
        const pct = r[row.userId];
        return typeof pct === "number" ? pct : null;
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
  const [replayToken, setReplayToken] = useState(0);

  const [displayed, setDisplayed] = useState<{ percentChange: number[]; asOfIdx: number }>(() => ({
    percentChange: finalRows.map((r) => (canAnimate ? 0 : r.percentChange)),
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

      const percentChange = finalRows.map((row) => {
        const series = seriesByUser.get(row.userId);
        if (!series) return 0;
        if (elapsed < series.staggerIndex * RACE_STAGGER_MS + RACE_DURATION_MS) {
          allDone = false;
        }
        const f = lineDrawFraction(elapsed, series.staggerIndex, RACE_DURATION_MS, RACE_STAGGER_MS);
        leadFraction = Math.max(leadFraction, f);
        const idx = series.firstIdx + Math.round(f * (lastIdx - series.firstIdx));
        // One decimal: the labels round anyway, and it keeps re-renders to a
        // few hundred per bar over the whole animation instead of one a frame.
        const raw = series.values[idx];
        return raw === null ? 0 : Math.round(raw * 10) / 10;
      });

      if (allDone) {
        setDisplayed({ percentChange: finalRows.map((r) => r.percentChange), asOfIdx: lastIdx });
        return;
      }
      const asOfIdx = Math.round(leadFraction * lastIdx);
      const key = `${percentChange.join(",")}|${asOfIdx}`;
      if (key !== lastKey) {
        lastKey = key;
        setDisplayed({ percentChange, asOfIdx });
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [canAnimate, finalRows, seriesByUser, lastIdx, replayToken]);

  if (finalRows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No one has logged a weigh-in yet.
      </div>
    );
  }

  // Re-sorted by *current* % change every tick (not the fixed final order)
  // so rows visibly overtake each other as the race plays out.
  const rows: Row[] = finalRows
    .map((row, i) => ({ ...row, percentChange: displayed.percentChange[i] ?? row.percentChange }))
    .sort((a, b) => a.percentChange - b.percentChange || a.name.localeCompare(b.name));
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
                recordRaceReplayAction("weightLoss").then(announceBadges);
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
        {rows.map((row) => {
          const widthPercent = Math.min(100, (Math.max(0, -row.percentChange) / domainMax) * 100);
          return (
            <div
              key={row.userId}
              className="absolute inset-x-0 flex items-center gap-3"
              style={{
                height: ROW_HEIGHT,
                transform: `translateY(${(rankByUserId.get(row.userId) ?? 0) * ROW_HEIGHT}px)`,
                transition: "transform 400ms ease",
              }}
              title={`${row.name}: ${formatPercent(row.percentChange)} since their first weigh-in`}
            >
              <div className="w-24 shrink-0 truncate text-xs text-muted sm:w-28">{row.name}</div>
              <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: colorMap[row.userId],
                    transition: "width 120ms linear",
                  }}
                />
              </div>
              <div className="w-12 shrink-0 text-right font-mono text-xs text-muted">
                {formatPercent(row.percentChange)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
