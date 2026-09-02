import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent, formatWeight, initials } from "@/lib/format";

const MEDALS = ["🥇", "🥈", "🥉"];

export function RankingsTable({
  entries,
  currentUserId,
  colorMap,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  colorMap: Record<string, string>;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No competitors yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-4 pb-1 font-medium">Rank</th>
            <th className="px-4 pb-1 font-medium">Name</th>
            <th className="px-4 pb-1 font-medium">Start</th>
            <th className="px-4 pb-1 font-medium">Current</th>
            <th className="px-4 pb-1 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isSelf = entry.userId === currentUserId;
            const change = entry.percentChange;
            const changeColor =
              change === null
                ? "text-muted"
                : change <= 0
                ? "text-accent"
                : "text-danger";

            return (
              <tr
                key={entry.userId}
                className={`rounded-xl transition-colors ${
                  isSelf ? "bg-accent/10" : "bg-surface"
                }`}
              >
                <td className="rounded-l-xl px-4 py-3 font-mono text-muted">
                  {entry.rank ? (
                    <span className="inline-flex items-center gap-1.5">
                      {MEDALS[entry.rank - 1] ?? `#${entry.rank}`}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: colorMap[entry.userId] }}
                    >
                      {initials(entry.fullName)}
                    </span>
                    <span className={isSelf ? "font-medium text-foreground" : "text-foreground"}>
                      {entry.fullName}
                      {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatWeight(entry.startWeight, entry.unit)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatWeight(entry.currentWeight, entry.unit)}
                </td>
                <td className={`rounded-r-xl px-4 py-3 text-right font-mono font-medium ${changeColor}`}>
                  {formatPercent(change)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
