type Participant = { id: string; fullName: string };

export function MissingToday({ people }: { people: Participant[] }) {
  if (people.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Haven&apos;t weighed in today</h2>
      <p className="mt-1 text-sm text-muted">A friendly nudge — no entry logged for today yet.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {people.map((person, i) => (
          <span
            key={person.id}
            className="animate-jiggle inline-block rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted"
            style={{ animationDelay: `${Math.min(i, 20) * 0.05}s` }}
          >
            {person.fullName}
          </span>
        ))}
      </div>
    </div>
  );
}
