"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localDateKey } from "@/lib/competition";
import { recordLocalVisitAction } from "@/app/actions/badges";
import { announceBadges } from "@/lib/badges/events";

/**
 * Mounted once in the root layout, which persists across client-side
 * navigations rather than remounting per page — so this fires on `pathname`
 * changing, not just on first mount, or it would only ever run once for the
 * very first page a visitor's browser tab loaded (e.g. the register page,
 * signed out) and never again for the rest of the session.
 *
 * Each protected page already records a visit against the server's UTC
 * "today" during SSR — this corrects that to the visitor's real local date
 * once the page hydrates, the same "SSR fallback, client corrects" pattern
 * as LiveStreakFlame/LiveMissingToday, just persisted instead of only
 * redrawn. Without it, two visits on genuinely consecutive local days can
 * land on the same UTC date for AU/NZ visitors and silently stall a
 * sign-in streak. A no-op for signed-out visitors (public pages mount it
 * too).
 */
export function LiveVisitRecorder() {
  const pathname = usePathname();

  useEffect(() => {
    recordLocalVisitAction(localDateKey(new Date())).then(announceBadges);
  }, [pathname]);

  return null;
}
