"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent, formatWeight, initials } from "@/lib/format";
import { UtensilsMedalIcon } from "@/lib/badges/icons";
import { GoalRing } from "@/components/GoalRing";

const MEDALS = ["🥇", "🥈", "🥉"];

export function RankingsTable({
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
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevOrderRef = useRef<string[]>([]);

  // FLIP-style rank-change transition: whenever the row order changes
  // between renders (someone's rank moved), slide each row from its old
  // screen position to its new one instead of just snapping.
  useLayoutEffect(() => {
    const tbody = tbodyRef.current;
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll<HTMLElement>("tr[data-user-id]"));
    const prevRects = prevRectsRef.current;
    const prevOrder = prevOrderRef.current;
    const currentOrder = rows.map((r) => r.dataset.userId!);
    const orderChanged =
      prevOrder.length > 0 &&
      (prevOrder.length !== currentOrder.length ||
        prevOrder.some((id, i) => id !== currentOrder[i]));

    if (orderChanged) {
      for (const row of rows) {
        const id = row.dataset.userId!;
        const prevRect = prevRects.get(id);
        if (!prevRect) continue;
        const newRect = row.getBoundingClientRect();
        const deltaY = prevRect.top - newRect.top;
        if (Math.abs(deltaY) > 0.5) {
          gsap.fromTo(row, { y: deltaY }, { y: 0, duration: 0.6, ease: "power2.out" });
        }
      }
    }

    const nextRects = new Map<string, DOMRect>();
    for (const row of rows) {
      nextRects.set(row.dataset.userId!, row.getBoundingClientRect());
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
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-4 pb-1 font-medium">Rank</th>
            <th className="px-4 pb-1 font-medium">Badges</th>
            <th className="px-4 pb-1 font-medium">Name</th>
            <th className="px-4 pb-1 font-medium">Start</th>
            <th className="px-4 pb-1 font-medium">Current</th>
            <th className="px-4 pb-1 text-right font-medium">Change</th>
            <th className="px-4 pb-1 text-center font-medium" title="Progress toward your own weight-loss goal">
              Goal
            </th>
            <th
              className="px-4 pb-1 text-right font-medium"
              title="Extrapolated from each person's own daily pace to the end of the competition"
            >
              Projected
            </th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {entries.map((entry) => {
            const isSelf = entry.userId === currentUserId;
            const masked = entry.hideWeight && !isSelf;
            const badgeCountChanged = changedBadgeUserIds?.has(entry.userId);
            const change = entry.percentChange;
            const changeColor =
              change === null
                ? "text-muted"
                : change <= 0
                ? "text-accent"
                : "text-danger";

            return (
              <tr
                key={entry.userId}
                data-user-id={entry.userId}
                className={`rounded-xl transition-colors ${
                  isSelf ? "bg-accent/10" : "bg-surface"
                }`}
              >
                <td className="rounded-l-xl px-4 py-3 font-mono text-muted">
                  {entry.rank ? (
                    <span className="inline-flex items-center gap-1.5">
                      {MEDALS[entry.rank - 1] ?? `#${entry.rank}`}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: colorMap[entry.userId] }}
                    >
                      {initials(entry.fullName)}
                    </span>
                    <span className={isSelf ? "font-medium text-foreground" : "text-foreground"}>
                      {entry.fullName}
                      {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {masked ? "🔒 Hidden" : formatWeight(entry.startWeight, entry.unit)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {masked ? "🔒 Hidden" : formatWeight(entry.currentWeight, entry.unit)}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${changeColor}`}>
                  {formatPercent(change)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <GoalRing progress={entry.goalProgressPercent} />
                  </div>
                </td>
                <td className="rounded-r-xl px-4 py-3 text-right font-mono">
                  <div className="text-muted italic">
                    {formatPercent(entry.predictedFinalPercent)}
                  </div>
                  {!masked && (
                    <div className="text-xs text-muted/70">
                      {formatWeight(entry.predictedFinalWeight, entry.unit)}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
