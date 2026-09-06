import { BADGES } from "@/lib/badges/definitions";

export function BadgeGallery({ earned }: { earned: { badgeId: string; earnedAt: Date }[] }) {
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

  return (
    <div>
      <p className="text-sm text-muted">
        {earnedMap.size} / {BADGES.length} earned
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {BADGES.map((badge) => {
          const earnedAt = earnedMap.get(badge.id);
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                earnedAt
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-surface-2/50 opacity-45"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface">
                <Icon className={`h-7 w-7 ${earnedAt ? "" : "grayscale"}`} />
              </div>
              <div className="text-sm font-medium">{badge.name}</div>
              <div className="text-xs text-muted">{badge.description}</div>
              {earnedAt && (
                <div className="text-[10px] font-medium uppercase tracking-wide text-accent">
                  {earnedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
