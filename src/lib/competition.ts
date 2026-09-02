// Fixed competition window. Dates are treated as UTC calendar days.
export const COMPETITION_START = "2026-09-04";
export const COMPETITION_END = "2026-12-15";

export const COMPETITION_START_DATE = new Date(`${COMPETITION_START}T00:00:00.000Z`);
export const COMPETITION_END_DATE = new Date(`${COMPETITION_END}T00:00:00.000Z`);

export const COMPETITION_TOTAL_DAYS =
  Math.round(
    (COMPETITION_END_DATE.getTime() - COMPETITION_START_DATE.getTime()) / 86_400_000
  ) + 1;

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Same idea as todayDateKey, but reads the calendar date from wherever this
// runs — the visitor's local timezone in the browser — instead of UTC. Server
// rendering always resolves "today" in UTC, which is hours behind AU/NZ, so
// status/day-count text needs this to be correct for those visitors.
export function localDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeyToLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function clampToCompetitionWindow(dateKey: string): boolean {
  return dateKey >= COMPETITION_START && dateKey <= COMPETITION_END;
}

export type CompetitionStatus = "upcoming" | "active" | "ended";

export function competitionStatus(todayKey: string = todayDateKey()): CompetitionStatus {
  if (todayKey < COMPETITION_START) return "upcoming";
  if (todayKey > COMPETITION_END) return "ended";
  return "active";
}

export function daysUntilStart(todayKey: string = todayDateKey()): number {
  const diff = COMPETITION_START_DATE.getTime() - new Date(`${todayKey}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export function daysRemaining(todayKey: string = todayDateKey()): number {
  const diff = COMPETITION_END_DATE.getTime() - new Date(`${todayKey}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}
