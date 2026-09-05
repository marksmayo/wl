export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatWeight(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)} ${unit}`;
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
