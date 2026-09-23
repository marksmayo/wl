"use server";

import { verifySession } from "@/lib/dal";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";

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
