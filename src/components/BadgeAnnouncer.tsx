"use client";

import { useEffect } from "react";
import { announceBadges } from "@/lib/badges/events";

/**
 * Bridges a server component's newly-earned badge ids into the client-side
 * toast bus. Renders nothing — mount it anywhere in a page that just
 * evaluated badges.
 */
export function BadgeAnnouncer({ badgeIds }: { badgeIds: string[] }) {
  useEffect(() => {
    announceBadges(badgeIds);
  }, [badgeIds]);

  return null;
}
