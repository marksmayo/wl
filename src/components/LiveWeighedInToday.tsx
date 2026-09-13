"use client";

import { useRef, useSyncExternalStore } from "react";
import { competitionStatus, localDateKey, computeWeighedInList, type Person } from "@/lib/competition";
import { WeighedInToday } from "@/components/WeighedInToday";

type RosterEntry = { id: string; fullName: string; loggedDates: string[] };

function subscribe() {
  // Same one-shot local-date correction as LiveMissingToday — nothing to
  // subscribe to, this doesn't change while the page is open.
  return () => {};
}

export function LiveWeighedInToday({
  roster,
  fallbackPeople,
}: {
  roster: RosterEntry[];
  fallbackPeople: Person[];
}) {
  const cacheRef = useRef<{ key: string; value: Person[] } | null>(null);

  function getSnapshot(): Person[] {
    const todayKey = localDateKey(new Date());
    if (cacheRef.current && cacheRef.current.key === todayKey) {
      return cacheRef.current.value;
    }
    const value = competitionStatus(todayKey) === "active" ? computeWeighedInList(roster, todayKey) : [];
    cacheRef.current = { key: todayKey, value };
    return value;
  }

  function getServerSnapshot(): Person[] {
    return fallbackPeople;
  }

  const people = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <WeighedInToday people={people} />;
}
