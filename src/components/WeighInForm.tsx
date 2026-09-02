"use client";

import { useActionState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { logWeighInAction, type WeighInFormState } from "@/app/actions/weighins";
import { COMPETITION_START, COMPETITION_END } from "@/lib/competition";

export function WeighInForm({
  unit,
  defaultDate,
  defaultWeight,
}: {
  unit: string;
  defaultDate: string;
  defaultWeight?: number;
}) {
  const [state, action, pending] = useActionState<WeighInFormState, FormData>(
    logWeighInAction,
    undefined
  );
  const cardRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={cardRef} className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Log today&apos;s weight</h2>
      <p className="mt-1 text-sm text-muted">
        One entry per day. Re-submitting a date updates that entry.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm text-muted">
              Date
            </label>
            <input
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
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="1"
              required
              defaultValue={defaultWeight}
              placeholder={unit === "kg" ? "70.5" : "155.0"}
              className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

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
