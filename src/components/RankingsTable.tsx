import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatPercent, formatWeight, initials } from "@/lib/format";
import { UtensilsMedalIcon } from "@/lib/badges/icons";

const MEDALS = ["🥇", "🥈", "🥉"];

export function RankingsTable({
  entries,
  currentUserId,
  colorMap,
  changedBadgeUserIds,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  colorMap: Record<string, string>;
  /** Users whose badge count has changed since the viewer last looked. */
  changedBadgeUserIds?: Set<string>;
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
      <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-4 pb-1 font-medium">Rank</th>
            <th className="px-4 pb-1 font-medium">Name</th>
            <th className="px-4 pb-1 font-medium">Start</th>
            <th className="px-4 pb-1 font-medium">Current</th>
            <th className="px-4 pb-1 text-right font-medium">Change</th>
            <th
              className="px-4 pb-1 text-right font-medium"
              title="Extrapolated from each person's own daily pace to the end of the competition"
            >
              Projected
            </th>
            <th className="px-4 pb-1 text-right font-medium">Badges</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isSelf = entry.userId === currentUserId;
            const masked = entry.hideWeight && !isSelf;
            const badgeCountChanged = changedBadgeUserIds?.has(entry.userId);
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
                  {masked ? "🔒 Hidden" : formatWeight(entry.startWeight, entry.unit)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {masked ? "🔒 Hidden" : formatWeight(entry.currentWeight, entry.unit)}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${changeColor}`}>
                  {formatPercent(change)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  <div className="text-muted italic">
                    {formatPercent(entry.predictedFinalPercent)}
                  </div>
                  {!masked && (
                    <div className="text-xs text-muted/70">
                      {formatWeight(entry.predictedFinalWeight, entry.unit)}
                    </div>
                  )}
                </td>
                <td className="rounded-r-xl px-4 py-3 text-right">
                  <Link
                    href={isSelf ? "/badges" : `/badges/${entry.userId}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-accent/50 hover:text-foreground ${
                      badgeCountChanged
                        ? "animate-badge-count-pulse border-accent text-foreground"
                        : "border-border text-muted"
                    }`}
                    title={badgeCountChanged ? "New badges since your last visit!" : "View badges"}
                  >
                    <UtensilsMedalIcon className="h-3.5 w-3.5" />
                    {entry.badgeCount}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
