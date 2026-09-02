"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { gsap } from "gsap";

export function AnimatedIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 0.8, delay, ease: "power3.out" }
      );
    }, el);
    return () => ctx.revert();
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function AnimatedStagger({
  children,
  className,
  itemSelector = ":scope > *",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  itemSelector?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(itemSelector);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }, el);
    return () => ctx.revert();
  }, [itemSelector, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
