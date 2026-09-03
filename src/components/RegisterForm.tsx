"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm text-muted">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          placeholder="Jamie Rivera"
          required
          minLength={2}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-muted">
          This is what everyone sees on the leaderboard, and how you log in.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm text-muted">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm text-muted">Weigh in using</legend>
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
                defaultChecked={u === "kg"}
                className="accent-[var(--accent)]"
              />
              {u}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-3 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
