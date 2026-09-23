/**
 * Timing shared by the leaderboard's WeightChart (Recharts Line draw-in) and
 * GoalProgressChart (bars replaying goal progress in step with those lines).
 * Change both charts' pace here, never in one place.
 */
export const LINE_DRAW_DURATION_MS = 8400;
export const LINE_DRAW_STAGGER_MS = 480;

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * CSS `ease-in-out`, i.e. cubic-bezier(0.42, 0, 0.58, 1) — what Recharts'
 * animationEasing="ease-in-out" resolves to. Newton's method on the curve's
 * x component, then evaluate y. Plenty accurate for keeping two charts in
 * step.
 */
export function lineDrawEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p1x = 0.42;
  const p2x = 0.58;
  const p1y = 0;
  const p2y = 1;
  const bez = (a: number, b: number, u: number) =>
    3 * a * (1 - u) * (1 - u) * u + 3 * b * (1 - u) * u * u + u * u * u;
  const bezDeriv = (a: number, b: number, u: number) =>
    3 * a * (1 - u) * (1 - u) + 6 * (b - a) * (1 - u) * u + 3 * (1 - b) * u * u;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = bez(p1x, p2x, u) - t;
    const d = bezDeriv(p1x, p2x, u);
    if (Math.abs(x) < 1e-4 || d === 0) break;
    u -= x / d;
  }
  return bez(p1y, p2y, clamp01(u));
}

/**
 * How far (0-1) a line that starts drawing after `staggerIndex` stagger steps
 * has been drawn `elapsedMs` after the animation began.
 */
export function lineDrawFraction(elapsedMs: number, staggerIndex: number): number {
  return lineDrawEase(
    clamp01((elapsedMs - staggerIndex * LINE_DRAW_STAGGER_MS) / LINE_DRAW_DURATION_MS)
  );
}
