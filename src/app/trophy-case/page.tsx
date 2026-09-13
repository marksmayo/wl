import { verifySession } from "@/lib/dal";
import { getTrophyCaseStats } from "@/lib/badges/trophyCase";
import { AnimatedIn } from "@/components/AnimatedIn";

export default async function TrophyCasePage() {
  await verifySession();
  const { totalUsers, entries } = await getTrophyCaseStats();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <AnimatedIn>
        <h1 className="text-3xl font-semibold tracking-tight">Trophy Case</h1>
        <p className="mt-1 text-sm text-muted">
          How rare is each badge across all {totalUsers} competitor{totalUsers === 1 ? "" : "s"}?
        </p>
      </AnimatedIn>

      <AnimatedIn delay={0.1} className="mt-8">
        <div className="glass rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {entries.map((entry, i) => {
              const Icon = entry.icon;
              const isRarest = i < 3 && entry.holders > 0;
              return (
                <div
                  key={entry.id}
                  title={entry.description}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                    isRarest
                      ? "border-accent-2/40 bg-accent-2/10"
                      : entry.holders > 0
                      ? "border-border bg-surface-2/50"
                      : "border-border bg-surface-2/50 opacity-45"
                  }`}
                >
                  {isRarest && (
                    <span className="absolute -top-2 right-2 rounded-full bg-accent-2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-background">
                      Rarest
                    </span>
                  )}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface">
                    <Icon className={`h-7 w-7 ${entry.holders > 0 ? "" : "grayscale"}`} />
                  </div>
                  <div className="text-sm font-medium">{entry.name}</div>
                  <div className="text-xs text-muted">{entry.description}</div>
                  <div className="text-[11px] font-medium text-muted">
                    {entry.holders === 0 ? (
                      "Nobody yet"
                    ) : (
                      <>
                        {entry.holders} {entry.holders === 1 ? "person" : "people"} ·{" "}
                        {entry.percent < 1 && entry.percent > 0
                          ? "<1%"
                          : `${Math.round(entry.percent)}%`}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedIn>
    </main>
  );
}
