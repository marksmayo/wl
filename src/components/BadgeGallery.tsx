import { BADGES } from "@/lib/badges/definitions";

const RARE_THRESHOLD_PERCENT = 15;

export function BadgeGallery({
  earned,
  rarityByBadgeId,
}: {
  earned: { badgeId: string; earnedAt: Date }[];
  rarityByBadgeId?: Map<string, number>;
}) {
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));
  const earnedCount = earnedMap.size;
  const progressPercent = BADGES.length > 0 ? (earnedCount / BADGES.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold">{earnedCount}</span>
          <span className="text-sm text-muted">/ {BADGES.length} earned</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {BADGES.map((badge) => {
          const earnedAt = earnedMap.get(badge.id);
          const Icon = badge.icon;
          const tint = badge.color;
          const percent = rarityByBadgeId?.get(badge.id);
          const isRare = earnedAt && percent !== undefined && percent > 0 && percent < RARE_THRESHOLD_PERCENT;

          return (
            <div
              key={badge.id}
              title={badge.description}
              style={
                earnedAt && tint
                  ? {
                      borderColor: `${tint}4D`,
                      backgroundColor: `${tint}0D`,
                      boxShadow: `0 0 20px -12px ${tint}`,
                    }
                  : undefined
              }
              className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
                earnedAt
                  ? `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                      tint ? "" : "border-accent/30 bg-accent/5"
                    }`
                  : "border-border bg-surface-2/50 opacity-45"
              }`}
            >
              {isRare && (
                <span
                  className="absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-background"
                  style={{ backgroundColor: tint }}
                >
                  Rare
                </span>
              )}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface"
                style={earnedAt && tint ? { backgroundColor: `${tint}1A` } : undefined}
              >
                <Icon className={`h-7 w-7 ${earnedAt ? "" : "grayscale"}`} />
              </div>
              <div className="text-sm font-medium">{badge.name}</div>
              <div className="text-xs text-muted">{badge.description}</div>
              {earnedAt && (
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                  <span style={tint ? { color: tint } : undefined} className={tint ? "" : "text-accent"}>
                    {earnedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                  {percent !== undefined && (
                    <span className="normal-case tracking-normal text-muted/70">
                      · {percent < 1 && percent > 0 ? "<1%" : `${Math.round(percent)}%`} have it
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
