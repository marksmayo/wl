"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent, formatWeight, initials } from "@/lib/format";
import { UtensilsMedalIcon } from "@/lib/badges/icons";
import { GoalRing } from "@/components/GoalRing";

const MEDALS = ["🥇", "🥈", "🥉"];

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
        const changeColor =
          change === null ? "text-muted" : change <= 0 ? "text-accent" : "text-danger";

        return (
          <div
            key={entry.userId}
            data-user-id={entry.userId}
            className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
              isSelf ? "border-accent/30 bg-accent/10" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 shrink-0 text-center font-mono text-sm text-muted">
                  {entry.rank ? (
                    <span className="inline-flex items-center gap-1.5">
                      {MEDALS[entry.rank - 1] ?? `#${entry.rank}`}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: colorMap[entry.userId] }}
                >
                  {initials(entry.fullName)}
                </span>
                <span className="min-w-0 truncate font-medium text-foreground">
                  {entry.fullName}
                  {isSelf && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                </span>
              </div>
              <Link
                href={isSelf ? "/badges" : `/badges/${entry.userId}`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-accent/50 hover:text-foreground ${
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

            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 lg:items-center lg:gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted">Start</div>
                <div className="mt-1 text-muted">
                  {masked ? "🔒 Hidden" : formatWeight(entry.startWeight, entry.unit)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted">Current</div>
                <div className="mt-1 text-muted">
                  {masked ? "🔒 Hidden" : formatWeight(entry.currentWeight, entry.unit)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted">Change</div>
                <div className={`mt-1 font-mono font-medium ${changeColor}`}>
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
                  <GoalRing progress={entry.goalProgressPercent} />
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
        );
      })}
    </div>
  );
}
