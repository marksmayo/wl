"use client";

import { useActionState } from "react";
import { updateUnitAction, type UpdateUnitFormState } from "@/app/actions/profile";

export function EditUnitForm({ currentUnit }: { currentUnit: string }) {
  const [state, action, pending] = useActionState<UpdateUnitFormState, FormData>(
    updateUnitAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex gap-3">
        {(["lbs", "kg"] as const).map((u) => (
          <label
            key={u}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
          >
            <input
              type="radio"
              name="unit"
              value={u}
              defaultChecked={u === currentUnit}
              className="accent-[var(--accent)]"
            />
            {u}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">
        Switching converts all your past weigh-ins to the new unit, so your
        progress and rank stay accurate.
      </p>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          Unit updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save unit"}
      </button>
    </form>
  );
}
