"use client";

import { useRef, useSyncExternalStore } from "react";
import { competitionStatus, localDateKey } from "@/lib/competition";
import { MissingToday } from "@/components/MissingToday";

type Person = { id: string; fullName: string };
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
  fallbackPeople: Person[];
}) {
  const cacheRef = useRef<{ key: string; value: Person[] } | null>(null);

  function getSnapshot(): Person[] {
    const todayKey = localDateKey(new Date());
    if (cacheRef.current && cacheRef.current.key === todayKey) {
      return cacheRef.current.value;
    }
    const value =
      competitionStatus(todayKey) === "active"
        ? roster
            .filter((r) => !r.loggedDates.includes(todayKey))
            .map((r) => ({ id: r.id, fullName: r.fullName }))
        : [];
    cacheRef.current = { key: todayKey, value };
    return value;
  }

  function getServerSnapshot(): Person[] {
    return fallbackPeople;
  }

  const people = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <MissingToday people={people} />;
}
