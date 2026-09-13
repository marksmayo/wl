"use client";

import { useEffect, useRef } from "react";
import { subscribeBadgeAnnouncements } from "@/lib/badges/events";

const COLORS = ["#34e0a1", "#7c5cff", "#38bdf8", "#f59e0b", "#f43f5e", "#ffd700"];
const GRAVITY = 0.18;
const DRAG = 0.995;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
};

/**
 * A short confetti burst, fired from wherever badge toasts appear
 * (top-right on desktop, top-center on mobile), whenever a new badge is
 * announced. Hand-rolled canvas particles rather than a library — it's a
 * small, one-off effect that doesn't need a dependency.
 */
export function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function fire(count: number) {
      if (!canvas) return;
      const originX = window.innerWidth < 640 ? window.innerWidth / 2 : window.innerWidth - 80;
      const originY = 60;
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI / 2;
        const speed = 4 + Math.random() * 5;
        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.3,
          life: 1,
        });
      }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function tick() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.life -= 0.012;

        if (p.life <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    }

    const unsubscribe = subscribeBadgeAnnouncements((ids) => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;
      fire(Math.min(60, 18 * ids.length));
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90]"
    />
  );
}
