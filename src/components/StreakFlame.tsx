import { FlameIcon } from "@/lib/badges/icons";

const MAX_SCALE_AT = 30; // streak length at which the flame reaches full size

export function StreakFlame({ streak }: { streak: number }) {
  if (streak <= 0) return null;

  const capped = Math.min(streak, MAX_SCALE_AT);
  const growth = capped / MAX_SCALE_AT;
  const scale = 1 + growth * 0.7;
  const glowPx = 4 + growth * 22;
  const glowAlpha = 0.35 + growth * 0.5;

  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-5">
      <div style={{ transform: `scale(${scale})` }}>
        <div
          className="animate-flame-flicker"
          style={{ filter: `drop-shadow(0 0 ${glowPx}px rgba(245, 158, 11, ${glowAlpha}))` }}
        >
          <FlameIcon color="#f59e0b" className="h-9 w-9" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold">
          {streak}-day streak{streak >= 7 && " 🔥"}
        </div>
        <div className="text-sm text-muted">Keep visiting daily to keep it growing.</div>
      </div>
    </div>
  );
}
