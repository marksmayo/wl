"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: value,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        if (el) el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, decimals, suffix, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}
