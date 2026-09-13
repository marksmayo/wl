"use client";

import { useActionState, useEffect } from "react";
import { updateGoalAction, type UpdateGoalFormState } from "@/app/actions/profile";
import { announceBadges } from "@/lib/badges/events";

export function EditGoalForm({ currentGoalPercent }: { currentGoalPercent: number | null }) {
  const [state, action, pending] = useActionState<UpdateGoalFormState, FormData>(
    updateGoalAction,
    undefined
  );

  useEffect(() => {
    if (state?.newBadges?.length) {
      announceBadges(state.newBadges);
    }
  }, [state?.newBadges]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="goalPercent" className="text-sm text-muted">
          Target weight loss (%)
        </label>
        <input
          id="goalPercent"
          name="goalPercent"
          type="number"
          step="0.1"
          min="0.1"
          max="100"
          placeholder="e.g. 10"
          defaultValue={currentGoalPercent ?? ""}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-muted">
          Shows as a progress ring on the leaderboard. Leave blank and save to clear your goal.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save goal"}
      </button>
    </form>
  );
}
