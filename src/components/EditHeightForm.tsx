"use client";

import { useActionState } from "react";
import { updateHeightAction, type UpdateHeightFormState } from "@/app/actions/profile";

export function EditHeightForm({
  currentHeight,
  unit,
}: {
  currentHeight: number | null;
  unit: string;
}) {
  const [state, action, pending] = useActionState<UpdateHeightFormState, FormData>(
    updateHeightAction,
    undefined
  );
  const label = unit === "kg" ? "cm" : "in";

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="height" className="text-sm text-muted">
          Height ({label})
        </label>
        <input
          id="height"
          name="height"
          type="number"
          step={unit === "kg" ? "1" : "0.1"}
          min="0"
          placeholder={unit === "kg" ? "e.g. 170" : "e.g. 67"}
          defaultValue={currentHeight ?? ""}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-muted">
          Used to show your BMI on the leaderboard. Leave blank and save to clear it.
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
        {pending ? "Saving…" : "Save height"}
      </button>
    </form>
  );
}
