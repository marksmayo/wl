import type { MissingPerson } from "@/lib/competition";

export function MissingToday({ people }: { people: MissingPerson[] }) {
  if (people.length === 0) return null;

  // people is sorted least-recent first, so the max gap (if any) is at the
  // front — flash whoever's tied for it, but only once it's a real gap
  // (more than a single missed day), not just "hasn't logged yet today".
  const maxDays = people[0].daysSinceLastWeighIn;
  const longestOverdue = maxDays > 1;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Haven&apos;t weighed in today</h2>
      <p className="mt-1 text-sm text-muted">A friendly nudge — no entry logged for today yet.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {people.map((person, i) => {
          const isLongestOverdue = longestOverdue && person.daysSinceLastWeighIn === maxDays;
          return (
            <span
              key={person.id}
              className={`inline-block rounded-full border px-3 py-1.5 text-sm ${
                isLongestOverdue
                  ? "animate-jiggle-flash-red border-danger/60 text-danger"
                  : "animate-jiggle border-border bg-surface-2 text-muted"
              }`}
              style={{ animationDelay: `${Math.min(i, 20) * 0.05}s` }}
              title={isLongestOverdue ? "Hasn't checked in the longest" : undefined}
            >
              {person.fullName}
              {person.daysSinceLastWeighIn > 1 && (
                <span className={`ml-1.5 ${isLongestOverdue ? "" : "text-danger"}`}>
                  ({person.daysSinceLastWeighIn} days)
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
