"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { logWeighInAction, type WeighInFormState } from "@/app/actions/weighins";
import {
  COMPETITION_START,
  COMPETITION_END,
  clampToCompetitionWindow,
  localDateKey,
} from "@/lib/competition";
import { announceBadges } from "@/lib/badges/events";

export function WeighInForm({
  unit,
  defaultDate,
  defaultWeight,
  weighIns = [],
}: {
  unit: string;
  defaultDate: string;
  defaultWeight?: number;
  weighIns?: { date: string; weight: number }[];
}) {
  const [state, action, pending] = useActionState<WeighInFormState, FormData>(
    logWeighInAction,
    undefined
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const weighInsRef = useRef(weighIns);
  useEffect(() => {
    weighInsRef.current = weighIns;
  }, [weighIns]);
  // Set only by a real user edit (native `input` event) — our own
  // corrections below write `.value` directly without dispatching one, so
  // this never gets set by us and can't mistake "we corrected it a minute
  // ago" for "the visitor picked a date on purpose."
  const touchedByUserRef = useRef(false);
  // Set when the visitor's device reports a date more than a day away from
  // the server's — no real IANA time zone diverges from UTC by more than a
  // day, so a bigger gap means the device's own clock/date is wrong, not a
  // time zone difference. Caught this way because it otherwise fails
  // silently: every weigh-in upserts onto whatever date the device thinks
  // "today" is, so it can look like daily logging while never actually
  // landing on a real day the leaderboard checks for.
  const [clockLooksWrong, setClockLooksWrong] = useState(false);

  useEffect(() => {
    if (state?.success && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { boxShadow: "0 0 0 0 rgba(52,224,161,0)" },
        {
          boxShadow: "0 0 0 6px rgba(52,224,161,0.15)",
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "power1.out",
        }
      );
    }
  }, [state?.success]);

  useEffect(() => {
    if (state?.newBadges?.length) {
      announceBadges(state.newBadges);
    }
  }, [state?.newBadges]);

  useEffect(() => {
    // The server resolves "today" in UTC, which lags AU/NZ visitors by
    // hours and can default this form to yesterday. Correct it to the
    // visitor's real local date whenever it's worth rechecking — on mount,
    // and again if the tab regains focus/visibility, since a tab left open
    // across a local midnight would otherwise keep showing the stale date
    // and silently save a weigh-in under the wrong day.
    const dateInput = dateRef.current;
    if (!dateInput) return;

    function correctDate() {
      const localToday = localDateKey(new Date());

      const driftDays = Math.round(
        (new Date(`${localToday}T00:00:00.000Z`).getTime() -
          new Date(`${defaultDate}T00:00:00.000Z`).getTime()) /
          86_400_000
      );
      setClockLooksWrong(Math.abs(driftDays) > 1);

      if (!dateInput || touchedByUserRef.current) return;

      const correctedDate = clampToCompetitionWindow(localToday)
        ? localToday
        : localToday < COMPETITION_START
        ? COMPETITION_START
        : COMPETITION_END;

      if (correctedDate === dateInput.value) return;

      dateInput.value = correctedDate;
      const match = weighInsRef.current.find((w) => w.date === correctedDate);
      if (weightRef.current) {
        weightRef.current.value = match ? String(match.weight) : "";
      }
    }

    function markTouched() {
      touchedByUserRef.current = true;
    }

    function onVisible() {
      if (document.visibilityState === "visible") correctDate();
    }

    correctDate();
    dateInput.addEventListener("input", markTouched);
    window.addEventListener("focus", correctDate);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      dateInput.removeEventListener("input", markTouched);
      window.removeEventListener("focus", correctDate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [defaultDate]);

  return (
    <div ref={cardRef} className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Log today&apos;s weight</h2>
      <p className="mt-1 text-sm text-muted">
        One entry per day. Re-submitting a date updates that entry.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm text-muted">
              Date
            </label>
            <input
              ref={dateRef}
              id="date"
              name="date"
              type="date"
              required
              defaultValue={defaultDate}
              min={COMPETITION_START}
              max={COMPETITION_END}
              className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="weight" className="text-sm text-muted">
              Weight ({unit})
            </label>
            <input
              ref={weightRef}
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              min="1"
              required
              defaultValue={defaultWeight}
              placeholder={unit === "kg" ? "70.50" : "155.00"}
              className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {clockLooksWrong && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Your device&apos;s date looks off, so weigh-ins might save under the wrong day and
            never show up as logged. Double-check the date &amp; time settings on your phone or
            computer (and that time zone is set automatically).
          </p>
        )}
        {state?.error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            Saved. Your progress is updated.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-3 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save weigh-in"}
        </button>
      </form>
    </div>
  );
}
