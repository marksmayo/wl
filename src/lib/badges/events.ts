// A tiny pub/sub for newly-earned badge ids, client-side only.
//
// Deliberately not a plain `window` CustomEvent: on a fresh full page load,
// React fires effects in tree order, and BadgeAnnouncer (nested inside the
// page content) can mount — and announce — before BadgeToastHost (a layout
// sibling rendered after {children}) has attached its listener, silently
// dropping the toast. Buffering announcements made with no listener yet,
// and flushing them to the first subscriber, makes this correct regardless
// of mount order.

type Listener = (ids: string[]) => void;

let pending: string[] = [];
const listeners = new Set<Listener>();

export function announceBadges(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  if (listeners.size === 0) {
    pending = pending.concat(ids);
    return;
  }
  for (const listener of listeners) listener(ids);
}

export function subscribeBadgeAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  if (pending.length > 0) {
    const queued = pending;
    pending = [];
    listener(queued);
  }
  return () => {
    listeners.delete(listener);
  };
}
