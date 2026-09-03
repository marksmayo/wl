"use client";

import { useActionState } from "react";
import { updateNameAction, type UpdateNameFormState } from "@/app/actions/profile";

export function EditNameForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState<UpdateNameFormState, FormData>(
    updateNameAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm text-muted">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={currentName}
          required
          minLength={2}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-muted">
          This is shown on the leaderboard and is what you log in with.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          Name updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
