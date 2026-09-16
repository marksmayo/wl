"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { RoughEase } from "gsap/EasePack";
import { SplitText } from "gsap/SplitText";
import { localDateKey } from "@/lib/competition";

gsap.registerPlugin(RoughEase, SplitText);

const STORAGE_KEY = "hg-intro-last-shown";
export const HOMEPAGE_TARGET_ID = "hero-reveal-target";
const MILESTONES = [25, 50, 75, 100];

const METALLIC_GRADIENT =
  "linear-gradient(110deg, #8a6d3b 0%, #f5e7c8 15%, #d9b26a 28%, #fff8e1 40%, #b9812f 52%, #8a6d3b 68%, #d9b26a 82%, #fff8e1 100%)";

function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== localDateKey();
  } catch {
    // Storage blocked (private browsing etc.) — skip rather than replay forever.
    return false;
  }
}

function markIntroShown() {
  try {
    window.localStorage.setItem(STORAGE_KEY, localDateKey());
  } catch {
    // Nothing we can do — just means it may play again next load.
  }
}

/**
 * Once-per-day cinematic intro on the homepage: a spark catches, a "100
 * DAYS" counter forges itself with hammer-strike flashes, the title reveals
 * letter by letter, then vault-door panels split to reveal the real page
 * underneath. Renders nothing (not even on the server) unless we've
 * confirmed, client-side, that it hasn't played yet today.
 */
export function HeroIntro() {
  // Always false on both the server render and the client's initial
  // (hydrating) render — so there's no hydration mismatch — then flipped
  // client-side once we've checked localStorage.
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const emberRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const counterWrapRef = useRef<HTMLDivElement>(null);
  const counterNumberRef = useRef<HTMLSpanElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const doorTopRef = useRef<HTMLDivElement>(null);
  const doorBottomRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // One-time, client-only gate: must run in an effect since it depends on
  // window/localStorage, which don't exist during SSR. The initial render
  // is always `false` on both server and client (see useState above), so
  // this can't cascade into a hydration-mismatch re-render — it's simply
  // the earliest point this check can safely run.
  useLayoutEffect(() => {
    if (shouldPlayIntro()) {
      markIntroShown();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (!active) return;

    const homepageEl = document.getElementById(HOMEPAGE_TARGET_ID);
    const strayAnimations: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    let split: SplitText | null = null;
    const counterProxy = { value: 0 };
    let milestoneIdx = 0;

    // Milestone hammer-strikes run as their own standalone animations (not
    // on the main timeline) so they can fire live off the counter's
    // onUpdate without disturbing the timeline's own sequencing/duration.
    function strike(color: string) {
      const shakeTl = gsap.timeline();
      shakeTl
        .to(rootRef.current, { y: -10, duration: 0.045, ease: "power1.inOut" })
        .to(rootRef.current, { y: 8, duration: 0.045, ease: "power1.inOut" })
        .to(rootRef.current, { y: -5, duration: 0.045, ease: "power1.inOut" })
        .to(rootRef.current, { y: 0, duration: 0.05, ease: "power1.inOut" });
      strayAnimations.push(shakeTl);

      const flashTween = gsap.fromTo(
        counterWrapRef.current,
        { textShadow: `0 0 0px ${color}00` },
        {
          textShadow: `0 0 50px ${color}, 0 0 100px ${color}`,
          duration: 0.09,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
      strayAnimations.push(flashTween);
    }

    const ctx = gsap.context(() => {
      // Homepage stays fully hidden behind the closed doors until the reveal.
      if (homepageEl) {
        gsap.set(homepageEl, { scale: 1.1, opacity: 0 });
      }

      if (titleRef.current) {
        split = new SplitText(titleRef.current, { type: "chars" });
        gsap.set(split.chars, { color: "#f0dfb4" });
      }

      const tl = gsap.timeline({ onComplete: () => setActive(false) });

      // --- Phase 1: The Spark ---
      tl.fromTo(
        emberRef.current,
        { scale: 0.6, opacity: 0.25 },
        {
          scale: 1,
          opacity: 1,
          duration: 2,
          ease: "rough({ strength: 2.5, points: 26, template: power1.inOut, randomize: true, clamp: true })",
        }
      )
        .to(emberRef.current, { scale: 2.8, opacity: 0, duration: 0.4, ease: "power2.in" })
        .fromTo(
          ringRef.current,
          { scale: 0, opacity: 1 },
          { scale: 1, opacity: 0, duration: 0.9, ease: "power3.out" },
          "<"
        )

        // --- Phase 2: The 100-Day Forging ---
        .set(counterWrapRef.current, { opacity: 1 }, "<0.1")
        .to(
          counterProxy,
          {
            value: 100,
            duration: 2.2,
            ease: "power1.inOut",
            onUpdate: () => {
              const v = Math.round(counterProxy.value);
              if (counterNumberRef.current) counterNumberRef.current.textContent = String(v);
              if (milestoneIdx < MILESTONES.length && v >= MILESTONES[milestoneIdx]) {
                milestoneIdx++;
                strike("#ff7a1a");
              }
            },
          },
          "<0.2"
        )

        // --- Phase 3: The Title Reveal ---
        .to(counterWrapRef.current, {
          opacity: 0,
          scale: 1.4,
          filter: "blur(12px)",
          duration: 0.5,
          ease: "power2.in",
        })
        .set(titleWrapRef.current, { opacity: 1 })
        .fromTo(
          split?.chars ?? [],
          { opacity: 0, scale: 0.7, filter: "blur(20px)" },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1,
            stagger: 0.035,
            ease: "power2.out",
          },
          "<"
        )
        .add(() => {
          // Letters have landed — collapse back to plain text so a single
          // continuous metallic gradient can sweep across the whole word.
          split?.revert();
          if (titleRef.current) {
            Object.assign(titleRef.current.style, {
              backgroundImage: METALLIC_GRADIENT,
              backgroundSize: "300% 100%",
              backgroundPosition: "0% 0%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            });
          }
        })
        .to(titleRef.current, { backgroundPosition: "100% 0%", duration: 1.3, ease: "power1.inOut" })
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        )
        .to({}, { duration: 0.7 })

        // --- Phase 4: The Arena Opens ---
        .to(titleWrapRef.current, { opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(doorTopRef.current, { yPercent: -100, duration: 1.6, ease: "power4.inOut" }, "doors")
        .to(doorBottomRef.current, { yPercent: 100, duration: 1.6, ease: "power4.inOut" }, "doors")
        .to(
          homepageEl ?? {},
          { scale: 1, opacity: 1, duration: 1.3, ease: "power2.out" },
          "doors+=0.2"
        );

      timelineRef.current = tl;
    }, rootRef);

    const skipBtn = skipRef.current;
    const onSkip = () => {
      // Jump straight to the settled end-state and unmount — no point
      // animating to a frame nobody will see.
      timelineRef.current?.kill();
      if (homepageEl) gsap.set(homepageEl, { scale: 1, opacity: 1 });
      setActive(false);
    };
    skipBtn?.addEventListener("click", onSkip);

    return () => {
      skipBtn?.removeEventListener("click", onSkip);
      strayAnimations.forEach((a) => a.kill());
      split?.revert();
      ctx.revert();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      role="presentation"
      aria-hidden="true"
      // Slightly oversized (vs. an exact inset-0) so the milestone camera
      // shake's small y-translations never expose a sliver of the real
      // page at the top/bottom edge of the viewport.
      className="fixed -inset-y-6 inset-x-0 z-[300] overflow-hidden bg-black"
    >
      <div
        ref={doorTopRef}
        className="absolute inset-x-0 top-0 h-[calc(50%+1px)] bg-black"
        style={{ willChange: "transform" }}
      />
      <div
        ref={doorBottomRef}
        className="absolute inset-x-0 bottom-0 h-[calc(50%+1px)] bg-black"
        style={{ willChange: "transform" }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
        <div
          ref={emberRef}
          className="pointer-events-none absolute h-4 w-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff2c8 0%, #ff8a29 40%, #ff4d1a 70%, transparent 78%)",
            boxShadow: "0 0 30px 12px rgba(255,120,30,0.65)",
            opacity: 0,
          }}
        />
        <div
          ref={ringRef}
          className="pointer-events-none absolute h-40 w-40 rounded-full sm:h-56 sm:w-56"
          style={{
            border: "3px solid rgba(255,150,70,0.9)",
            boxShadow: "0 0 40px 6px rgba(255,120,40,0.5)",
            opacity: 0,
          }}
        />

        <div ref={counterWrapRef} className="flex flex-col items-center opacity-0">
          <span
            ref={counterNumberRef}
            className="font-mono text-7xl font-black text-[#ffb26b] sm:text-8xl"
          >
            0
          </span>
          <span className="mt-1 text-sm uppercase tracking-[0.4em] text-[#ffb26b]/80">Days</span>
        </div>

        <div ref={titleWrapRef} className="flex flex-col items-center text-center opacity-0">
          <h1
            ref={titleRef}
            className="whitespace-nowrap text-4xl font-black uppercase tracking-tight text-[#f0dfb4] sm:text-6xl md:text-7xl"
          >
            The Hungry Games
          </h1>
          <p ref={taglineRef} className="mt-4 text-sm uppercase tracking-[0.3em] text-muted opacity-0">
            Let the games begin.
          </p>
        </div>
      </div>

      <button
        ref={skipRef}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute bottom-6 right-6 z-20 cursor-pointer text-xs uppercase tracking-widest text-muted/60 transition-colors hover:text-muted"
      >
        Skip →
      </button>
    </div>
  );
}
