"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

type Props =
  | { loggedIn: true; fullName: string }
  | { loggedIn: false; fullName?: undefined };

const linkClass =
  "block w-full rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2";

export function MobileNav(props: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close whenever the route changes (link click, back/forward, etc.) —
  // adjusting state during render instead of an effect avoids an extra pass.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <path d="M0 1H18M0 7H18M0 13H18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open &&
        // Portalled to <body>: an ancestor with backdrop-filter (our sticky
        // header) becomes a containing block for `fixed` descendants in
        // Chromium/WebKit, which would otherwise confine this overlay to
        // the header's own box instead of the full viewport.
        createPortal(
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />,
          document.body
        )}

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-4 top-[calc(100%+8px)] z-50 rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/60"
        >
          {props.loggedIn ? (
            <>
              <Link href="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <Link href="/leaderboard" className={linkClass}>
                Leaderboard
              </Link>
              <Link href="/settings" className={linkClass}>
                Settings
              </Link>
              <div className="my-2 border-t border-border" />
              <div className="px-4 py-2 text-sm text-muted">{props.fullName}</div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="block w-full rounded-xl px-4 py-3 text-left text-base text-foreground transition-colors hover:bg-surface-2"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link href="/register" className={linkClass}>
                Join the comp
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
