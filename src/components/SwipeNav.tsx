"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";

// The only two stops on this swipe rail, in swipe order — swiping left from
// dashboard goes to leaderboard, swiping right from leaderboard comes back.
const ROUTES = ["/dashboard", "/leaderboard"];
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leaderboard": "Leaderboard",
};

const THRESHOLD = 80; // px of raw horizontal drag needed to commit to navigating
const RUBBER_BAND_AT = 100; // px past which extra drag distance starts diminishing

function resistedDrag(dx: number): number {
  if (Math.abs(dx) <= RUBBER_BAND_AT) return dx;
  const extra = Math.abs(dx) - RUBBER_BAND_AT;
  return Math.sign(dx) * (RUBBER_BAND_AT + extra * 0.25);
}

// Ignore gestures starting inside anything that actually scrolls
// horizontally itself (e.g. the dashboard's "Your entries" table) — let
// native scrolling win there instead of hijacking it for page navigation.
function startsInsideHorizontalScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el.id !== "page-content") {
    if (el.scrollWidth > el.clientWidth + 1) return true;
    el = el.parentElement;
  }
  return false;
}

export function SwipeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingEntranceRef = useRef<"from-left" | "from-right" | null>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = document.getElementById("page-content");
    const hintEl = hintRef.current;
    const index = ROUTES.indexOf(pathname);

    if (!content) return;

    if (index === -1) {
      pendingEntranceRef.current = null;
      return;
    }

    if (pendingEntranceRef.current) {
      const fromX = pendingEntranceRef.current === "from-right" ? 60 : -60;
      pendingEntranceRef.current = null;
      gsap.fromTo(
        content,
        { x: fromX, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    } else {
      gsap.set(content, { x: 0, opacity: 1 });
    }

    const gesture = { active: false, dragging: false, startX: 0, startY: 0, dx: 0 };

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      if (startsInsideHorizontalScroller(e.target)) return;
      const t = e.touches[0];
      gesture.active = true;
      gesture.dragging = false;
      gesture.startX = t.clientX;
      gesture.startY = t.clientY;
      gesture.dx = 0;
    }

    function onTouchMove(e: TouchEvent) {
      if (!gesture.active) return;
      const t = e.touches[0];
      const dx = t.clientX - gesture.startX;
      const dy = t.clientY - gesture.startY;

      if (!gesture.dragging) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.3) {
          gesture.active = false; // reads as a vertical scroll — back off entirely
          return;
        }
        gesture.dragging = true;
      }

      const canGoNext = index < ROUTES.length - 1 && dx < 0;
      const canGoPrev = index > 0 && dx > 0;
      if (!canGoNext && !canGoPrev) {
        gesture.dx = 0;
        gsap.set(content, { x: 0 });
        if (hintEl) hintEl.style.opacity = "0";
        return;
      }

      e.preventDefault();
      gesture.dx = dx;
      gsap.set(content, { x: resistedDrag(dx) });

      if (hintEl) {
        const targetRoute = ROUTES[canGoNext ? index + 1 : index - 1];
        hintEl.textContent = `${canGoNext ? "→" : "←"} ${ROUTE_LABELS[targetRoute]}`;
        hintEl.style.opacity = String(Math.min(1, Math.abs(dx) / THRESHOLD));
      }
    }

    function onTouchEnd() {
      if (hintEl) hintEl.style.opacity = "0";
      if (!gesture.dragging) {
        gesture.active = false;
        return;
      }
      gesture.active = false;
      gesture.dragging = false;

      const dx = gesture.dx;
      if (Math.abs(dx) >= THRESHOLD) {
        const goingNext = dx < 0;
        const targetIndex = goingNext ? index + 1 : index - 1;
        pendingEntranceRef.current = goingNext ? "from-right" : "from-left";
        gsap.set(content, { x: 0 });
        router.push(ROUTES[targetIndex]);
      } else {
        gsap.to(content, { x: 0, duration: 0.3, ease: "back.out(1.7)" });
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pathname, router]);

  return (
    <div
      ref={hintRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface/90 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm"
      style={{ opacity: 0 }}
    />
  );
}
