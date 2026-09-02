"use client";

import { useSyncExternalStore } from "react";
import {
  competitionStatus,
  daysRemaining,
  daysUntilStart,
  localDateKey,
  type CompetitionStatus,
} from "@/lib/competition";

type Snapshot = { status: CompetitionStatus; days: number };

let cachedDateKey: string | null = null;
let cachedSnapshot: Snapshot | null = null;

// Recomputed only when the visitor's local calendar date actually changes,
// so the same object reference is returned otherwise (required for
// useSyncExternalStore to avoid re-rendering every tick).
function getClientSnapshot(): Snapshot {
  const todayKey = localDateKey(new Date());
  if (todayKey !== cachedDateKey || !cachedSnapshot) {
    cachedDateKey = todayKey;
    const status = competitionStatus(todayKey);
    const days =
      status === "upcoming"
        ? daysUntilStart(todayKey)
        : status === "active"
        ? daysRemaining(todayKey)
        : 0;
    cachedSnapshot = { status, days };
  }
  return cachedSnapshot;
}

function subscribe() {
  // Nothing to subscribe to — this is a one-shot correction from the
  // server's UTC-based render to the browser's real local date, not a
  // value that changes while the page is open.
  return () => {};
}

type Props = {
  fallbackStatus: CompetitionStatus;
  fallbackDays: number;
  variant: "badge" | "dashboard" | "leaderboard";
};

/**
 * The server always resolves "today" in UTC, which is hours behind AU/NZ
 * visitors and can make the countdown read a day (or more) off. This renders
 * the server's UTC-based value first (so SSR output matches hydration), then
 * corrects itself to the visitor's actual local date via useSyncExternalStore.
 */
export function LiveCompetitionStatus({ fallbackStatus, fallbackDays, variant }: Props) {
  const { status, days } = useSyncExternalStore(subscribe, getClientSnapshot, () => ({
    status: fallbackStatus,
    days: fallbackDays,
  }));

  if (variant === "badge") {
    if (status === "upcoming") return <>Starts in {days} days</>;
    if (status === "active") return <>{days} days remaining</>;
    return <>Competition ended</>;
  }

  if (variant === "dashboard") {
    if (status === "active") return <>{days} days left in the competition.</>;
    if (status === "upcoming")
      return <>The competition hasn&apos;t started yet — log a baseline once it opens.</>;
    return <>The competition has ended. Great work!</>;
  }

  // leaderboard
  if (status === "active") return <>{days} days remaining · </>;
  if (status === "upcoming") return <>Starts in {days} days · </>;
  return null;
}
