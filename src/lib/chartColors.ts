// Fixed categorical order, validated for CVD-safety on the app's dark surface
// (see dataviz skill). Never cycle within the first 8 — only wrap past that.
export const SERIES_COLORS = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
];

export function colorForIndex(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

/**
 * Assigns each user a stable color by a fixed order (e.g. join date), so the
 * same person is always the same color across the chart, table, and avatars —
 * regardless of how each view happens to sort or rank them.
 */
export function buildColorMap(orderedUserIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  orderedUserIds.forEach((id, i) => {
    map[id] = colorForIndex(i);
  });
  return map;
}
