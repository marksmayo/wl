"use client";

import { useActionState, useEffect, useState } from "react";
import { updateGoalAction, type UpdateGoalFormState } from "@/app/actions/profile";
import { announceBadges } from "@/lib/badges/events";

type GoalMode = "percent" | "weight";

export function EditGoalForm({
  currentGoalPercent,
  currentGoalWeight,
  unit,
}: {
  currentGoalPercent: number | null;
  currentGoalWeight: number | null;
  unit: string;
}) {
  const [state, action, pending] = useActionState<UpdateGoalFormState, FormData>(
    updateGoalAction,
    undefined
  );
  const [mode, setMode] = useState<GoalMode>(currentGoalWeight != null ? "weight" : "percent");

  useEffect(() => {
    if (state?.newBadges?.length) {
      announceBadges(state.newBadges);
    }
  }, [state?.newBadges]);

  const defaultValue =
    mode === "weight"
      ? currentGoalWeight ?? ""
      : currentGoalWeight == null
      ? currentGoalPercent ?? ""
      : "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="goalMode" value={mode} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Set your goal as</span>
        <div className="inline-flex w-fit rounded-xl border border-border bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setMode("percent")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "percent" ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            % lost
          </button>
          <button
            type="button"
            onClick={() => setMode("weight")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "weight" ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            Target weight
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="goalValue" className="text-sm text-muted">
          {mode === "percent" ? "Target weight loss (%)" : `Target weight (${unit})`}
        </label>
        <input
          key={mode}
          id="goalValue"
          name="goalValue"
          type="number"
          step={mode === "percent" ? "0.1" : "0.01"}
          min={mode === "percent" ? "0.1" : "0"}
          max={mode === "percent" ? "100" : undefined}
          placeholder={mode === "percent" ? "e.g. 10" : unit === "kg" ? "e.g. 65" : "e.g. 145"}
          defaultValue={defaultValue}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-muted">
          {mode === "percent"
            ? "Shows as a progress ring on the leaderboard."
            : "Converted to a % of your starting weight — you need at least one weigh-in logged first."}{" "}
          Leave blank and save to clear your goal.
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
