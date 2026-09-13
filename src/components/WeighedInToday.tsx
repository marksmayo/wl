import type { Person } from "@/lib/competition";

export function WeighedInToday({ people }: { people: Person[] }) {
  if (people.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Weighed in today</h2>
      <p className="mt-1 text-sm text-muted">Nice work — these people are all caught up.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {people.map((person) => (
          <span
            key={person.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-foreground"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
              aria-hidden="true"
            >
              <path d="M4 12.5 9.5 18 20 6.5" />
            </svg>
            {person.fullName}
          </span>
        ))}
      </div>
    </div>
  );
}
