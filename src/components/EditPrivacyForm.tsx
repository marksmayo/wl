"use client";

import { useActionState } from "react";
import { updatePrivacyAction, type UpdatePrivacyFormState } from "@/app/actions/profile";

export function EditPrivacyForm({ hideWeight }: { hideWeight: boolean }) {
  const [state, action, pending] = useActionState<UpdatePrivacyFormState, FormData>(
    updatePrivacyAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10">
        <input
          type="checkbox"
          name="hideWeight"
          defaultChecked={hideWeight}
          className="mt-0.5 accent-[var(--accent)]"
        />
        <span>
          Hide my weight from others
          <span className="block text-xs text-muted">
            Only your % change shows on the leaderboard — your actual weight stays private.
          </span>
        </span>
      </label>

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
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
