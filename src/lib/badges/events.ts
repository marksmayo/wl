// A tiny pub/sub for newly-earned badge ids, client-side only.
//
// Deliberately not a plain `window` CustomEvent: on a fresh full page load,
// React fires effects in tree order, and BadgeAnnouncer (nested inside the
// page content) can mount — and announce — before BadgeToastHost (a layout
// sibling rendered after {children}) has attached its listener, silently
// dropping the toast. Buffering announcements made with no listener yet
// fixes that — but there are now multiple independent subscribers
// (BadgeToastHost, ConfettiBurst), all mounting as siblings in the same
// commit. Delivering the buffer to each subscriber as it mounts, and only
// clearing it on a microtask (after every synchronously-mounting sibling
// has had a chance to subscribe), means every one of them sees it — not
// just whichever happened to subscribe first.

type Listener = (ids: string[]) => void;

let pending: string[] = [];
let pendingClearScheduled = false;
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
    listener(pending);
    if (!pendingClearScheduled) {
      pendingClearScheduled = true;
      queueMicrotask(() => {
        pending = [];
        pendingClearScheduled = false;
      });
    }
  }
  return () => {
    listeners.delete(listener);
  };
}
