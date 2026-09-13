"use client";

import { useRef, useSyncExternalStore } from "react";
import { localDateKey } from "@/lib/competition";
import { currentStreak } from "@/lib/badges/streaks";
import { StreakFlame } from "@/components/StreakFlame";

function subscribe() {
  // One-shot local-date correction, same as LiveMissingToday — nothing to
  // subscribe to, this doesn't change while the page is open.
  return () => {};
}

/**
 * The server computes the streak against UTC "today", which lags AU/NZ
 * visitors by hours — same class of bug as the countdown and the missing
 * weigh-in list. Renders the server's UTC-based count first (matching SSR
 * output for hydration), then recomputes against the visitor's real local
 * date.
 */
export function LiveStreakFlame({
  visitDates,
  fallbackStreak,
}: {
  visitDates: string[];
  fallbackStreak: number;
}) {
  const cacheRef = useRef<{ key: string; value: number } | null>(null);

  function getSnapshot(): number {
    const todayKey = localDateKey(new Date());
    if (cacheRef.current && cacheRef.current.key === todayKey) {
      return cacheRef.current.value;
    }
    const value = currentStreak(visitDates, todayKey);
    cacheRef.current = { key: todayKey, value };
    return value;
  }

  function getServerSnapshot(): number {
    return fallbackStreak;
  }

  const streak = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <StreakFlame streak={streak} />;
}
