"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent, formatWeight } from "@/lib/format";
import { UtensilsMedalIcon } from "@/lib/badges/icons";
import { GoalRing } from "@/components/GoalRing";
import { RankMedal } from "@/components/RankMedal";

// Small hand-rolled trend line (no charting library needed for 14 points) —
// normalized to its own min/max so a flat-ish week still shows visible shape.
function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function RankingsList({
  entries,
  currentUserId,
  colorMap,
  changedBadgeUserIds,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  colorMap: Record<string, string>;
  /** Users whose badge count has changed since the viewer last looked. */
  changedBadgeUserIds?: Set<string>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevOrderRef = useRef<string[]>([]);

  // FLIP-style rank-change transition: whenever the card order changes
  // between renders (someone's rank moved), slide each card from its old
  // screen position to its new one instead of just snapping.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-user-id]"));
    const prevRects = prevRectsRef.current;
    const prevOrder = prevOrderRef.current;
    const currentOrder = cards.map((c) => c.dataset.userId!);
    const orderChanged =
      prevOrder.length > 0 &&
      (prevOrder.length !== currentOrder.length ||
        prevOrder.some((id, i) => id !== currentOrder[i]));

    if (orderChanged) {
      for (const card of cards) {
        const id = card.dataset.userId!;
        const prevRect = prevRects.get(id);
        if (!prevRect) continue;
        const newRect = card.getBoundingClientRect();
        const deltaY = prevRect.top - newRect.top;
        if (Math.abs(deltaY) > 0.5) {
          gsap.fromTo(card, { y: deltaY }, { y: 0, duration: 0.6, ease: "power2.out" });
        }
      }
    }

    const nextRects = new Map<string, DOMRect>();
    for (const card of cards) {
      nextRects.set(card.dataset.userId!, card.getBoundingClientRect());
    }
    prevRectsRef.current = nextRects;
    prevOrderRef.current = currentOrder;
  });

  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No competitors yet.
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex flex-col gap-3">
      {entries.map((entry) => {
        const isSelf = entry.userId === currentUserId;
        const masked = entry.hideWeight && !isSelf;
        const badgeCountChanged = changedBadgeUserIds?.has(entry.userId);
        const change = entry.percentChange;
        const isGoodChange = change !== null && change <= 0;
        const changeColor =
          change === null ? "text-muted" : isGoodChange ? "text-accent" : "text-danger";
        const trendColor =
          entry.sparkline.length >= 2 &&
          entry.sparkline[entry.sparkline.length - 1] <= entry.sparkline[0]
            ? "var(--accent)"
            : "var(--danger)";

        return (
          <div
            key={entry.userId}
            data-user-id={entry.userId}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
              isSelf
                ? "border-accent/40 bg-gradient-to-br from-accent/10 via-surface to-surface shadow-[0_0_0_1px_rgba(52,224,161,0.12),0_12px_28px_-16px_rgba(52,224,161,0.45)]"
                : "border-border bg-surface hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2/70 hover:shadow-xl hover:shadow-black/20"
            }`}
          >
            <span
              className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
              style={{ backgroundColor: colorMap[entry.userId] }}
              aria-hidden="true"
            />

            <div className="flex items-center justify-between gap-2 pl-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <RankMedal rank={entry.rank} />
                <span className="min-w-0 truncate text-[15px] font-medium text-foreground">
                  {entry.fullName}
                </span>
                {isSelf && (
                  <span className="hidden shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent sm:inline-block">
                    You
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {entry.sparkline.length >= 2 && (
                  <svg
                    width={56}
                    height={20}
                    className="hidden sm:block"
                    aria-hidden="true"
                  >
                    <path
                      d={sparklinePath(entry.sparkline, 56, 20)}
                      fill="none"
                      stroke={trendColor}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.85}
                    />
                  </svg>
                )}
                <Link
                  href={isSelf ? "/badges" : `/badges/${entry.userId}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-accent/50 hover:text-foreground ${
                    badgeCountChanged
                      ? "animate-badge-count-pulse border-accent text-foreground"
                      : "border-border text-muted"
                  }`}
                  title={badgeCountChanged ? "New badges since your last visit!" : "View badges"}
                >
                  <UtensilsMedalIcon className="h-3.5 w-3.5" />
                  {entry.badgeCount}
                </Link>
              </div>
            </div>

            <div className="mt-4 border-t border-border/60 pl-2 pt-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 lg:items-center lg:gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">Start</div>
                  <div className="mt-1 font-mono text-muted">
                    {masked ? "🔒 Hidden" : formatWeight(entry.startWeight, entry.unit)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">Current</div>
                  <div className="mt-1 font-mono text-foreground">
                    {masked ? "🔒 Hidden" : formatWeight(entry.currentWeight, entry.unit)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">Change</div>
                  <div
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono font-medium ${changeColor} ${
                      change === null ? "" : isGoodChange ? "bg-accent/10" : "bg-danger/10"
                    }`}
                  >
                    {change !== null && (
                      <span className="text-[9px]">{isGoodChange ? "▼" : "▲"}</span>
                    )}
                    {formatPercent(change)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide text-muted"
                    title="Progress toward your own weight-loss goal"
                  >
                    Goal
                  </div>
                  <div className="mt-1.5">
                    {isSelf ? (
                      <Link
                        href="/settings"
                        className="inline-block rounded-full transition-transform hover:scale-110"
                        title={
                          entry.goalProgressPercent === null
                            ? "No goal set — click to set one"
                            : "Click to change your goal"
                        }
                      >
                        <GoalRing
                          progress={entry.goalProgressPercent}
                          title={
                            entry.goalProgressPercent === null
                              ? "No goal set — click to set one"
                              : "Click to change your goal"
                          }
                        />
                      </Link>
                    ) : (
                      <GoalRing progress={entry.goalProgressPercent} />
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide text-muted"
                    title="Extrapolated from each person's own daily pace to the end of the competition"
                  >
                    Projected
                  </div>
                  <div className="mt-1 font-mono italic text-muted">
                    {formatPercent(entry.predictedFinalPercent)}
                  </div>
                  {!masked && (
                    <div className="font-mono text-xs text-muted/70">
                      {formatWeight(entry.predictedFinalWeight, entry.unit)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
