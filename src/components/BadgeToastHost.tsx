"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeBadgeAnnouncements } from "@/lib/badges/events";
import { BADGES_BY_ID } from "@/lib/badges/definitions";

type Toast = { key: string; id: string };

const DISPLAY_MS = 5000;

export function BadgeToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    return subscribeBadgeAnnouncements((ids) => {
      setToasts((prev) => [
        ...prev,
        ...ids.map((id) => ({ key: `${Date.now()}-${counterRef.current++}`, id })),
      ]);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:left-auto sm:right-4 sm:items-end">
      {toasts.map((t) => (
        <BadgeToast
          key={t.key}
          id={t.id}
          onDone={() => setToasts((prev) => prev.filter((x) => x.key !== t.key))}
        />
      ))}
    </div>
  );
}

function BadgeToast({ id, onDone }: { id: string; onDone: () => void }) {
  const badge = BADGES_BY_ID[id];

  useEffect(() => {
    const timer = setTimeout(onDone, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!badge) return null;
  const Icon = badge.icon;

  return (
    <div className="glass animate-badge-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-accent/30 p-4 shadow-xl shadow-black/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-accent">
          Badge earned
        </div>
        <div className="truncate font-semibold">{badge.name}</div>
        <div className="truncate text-xs text-muted">{badge.description}</div>
      </div>
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss"
        className="ml-auto shrink-0 cursor-pointer text-lg leading-none text-muted transition-colors hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
