import type { EvaluateOptions } from "./evaluate";

/**
 * Builds the `afterWeighIn` context evaluateAndAwardBadges expects, from a
 * user's full ordered weigh-in history. Shared by the weigh-in action (a
 * single new entry), the dashboard page (full history, so anyone who
 * weighed in before badges existed still catches up automatically), and
 * the admin backfill endpoint (same thing, for every user at once).
 */
export function buildAfterWeighInContext(
  weighIns: { date: Date; weight: number }[]
): EvaluateOptions["afterWeighIn"] {
  if (weighIns.length === 0) return undefined;

  const everGained = weighIns.some((w, i) => i > 0 && w.weight > weighIns[i - 1].weight);

  return {
    weighInDates: weighIns.map((w) => w.date.toISOString().slice(0, 10)),
    firstWeight: weighIns[0].weight,
    latestWeight: weighIns[weighIns.length - 1].weight,
    previousWeight: weighIns.length > 1 ? weighIns[weighIns.length - 2].weight : null,
    everGained,
  };
}
