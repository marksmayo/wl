"use server";

import { verifySession, getOptionalSession } from "@/lib/dal";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";
import { todayDateKey } from "@/lib/competition";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Called directly (not via a <form>) when the user clicks Replay on one of
 * the leaderboard's race charts — there's no page navigation to piggyback a
 * badge check on, so this is its own round trip.
 */
export async function recordRaceReplayAction(
  race: "weightLoss" | "goalProgress"
): Promise<string[]> {
  const session = await verifySession();

  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    markReplayedWeightLossRace: race === "weightLoss",
    markReplayedGoalProgressRace: race === "goalProgress",
  });

  return newBadges.map((b) => b.id);
}

/**
 * Called once per page load from a small always-mounted client component,
 * passing the visitor's real local date. The pages themselves already record
 * a visit against the server's UTC "today" during SSR, but UTC lags AU/NZ
 * visitors by hours — two visits on genuinely consecutive local days can
 * land on the same UTC date and silently stall a sign-in streak. This is a
 * no-op for signed-out visitors (public pages mount it too).
 */
export async function recordLocalVisitAction(localDateKey: string): Promise<string[]> {
  const session = await getOptionalSession();
  if (!session || !DATE_KEY_RE.test(localDateKey)) return [];

  // No real timezone puts a visitor's local date more than a day from UTC —
  // bound the client-supplied value to that so a corrupted/tampered date
  // can't fabricate arbitrary streak history.
  const driftDays = Math.round(
    (new Date(`${localDateKey}T00:00:00.000Z`).getTime() -
      new Date(`${todayDateKey()}T00:00:00.000Z`).getTime()) /
      86_400_000
  );
  if (Math.abs(driftDays) > 1) return [];

  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    recordVisit: true,
    visitDateKey: localDateKey,
  });

  return newBadges.map((b) => b.id);
}
