"use client";

import { useRef, useSyncExternalStore } from "react";
import { competitionStatus, localDateKey, computeMissingList, type MissingPerson } from "@/lib/competition";
import { MissingToday } from "@/components/MissingToday";

type RosterEntry = { id: string; fullName: string; loggedDates: string[] };

function subscribe() {
  // Nothing to subscribe to — this is a one-shot correction from the
  // server's UTC-based render to the visitor's real local date, not a
  // value that changes while the page is open.
  return () => {};
}

/**
 * The server decides "today" (and thus who's missing) in UTC, which is
 * hours behind AU/NZ visitors — the same class of bug as the countdown and
 * the weigh-in form's default date. This renders the server's UTC-based
 * list first (so SSR output matches hydration), then recomputes against
 * the visitor's actual local date.
 */
export function LiveMissingToday({
  roster,
  fallbackPeople,
}: {
  roster: RosterEntry[];
  fallbackPeople: MissingPerson[];
}) {
  const cacheRef = useRef<{ key: string; value: MissingPerson[] } | null>(null);

  function getSnapshot(): MissingPerson[] {
    const todayKey = localDateKey(new Date());
    if (cacheRef.current && cacheRef.current.key === todayKey) {
      return cacheRef.current.value;
    }
    const value = competitionStatus(todayKey) === "active" ? computeMissingList(roster, todayKey) : [];
    cacheRef.current = { key: todayKey, value };
    return value;
  }

  function getServerSnapshot(): MissingPerson[] {
    return fallbackPeople;
  }

  const people = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <MissingToday people={people} />;
}
