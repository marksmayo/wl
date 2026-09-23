import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/dal";
import {
  COMPETITION_START_DATE,
  COMPETITION_END_DATE,
  COMPETITION_TOTAL_DAYS,
  competitionStatus,
  daysRemaining,
  daysUntilStart,
} from "@/lib/competition";
import { ThreeBackground } from "@/components/ThreeBackground";
import { AnimatedIn, AnimatedStagger } from "@/components/AnimatedIn";
import { CountUp } from "@/components/CountUp";
import { LiveCompetitionStatus } from "@/components/LiveCompetitionStatus";
import { HeroIntro, HOMEPAGE_TARGET_ID } from "@/components/HeroIntro";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
};

/**
 * The landing page is almost entirely static, so it's prerendered and served
 * straight from the CDN. Only three small pieces depend on the request and
 * stream in behind Suspense: the day countdown, the sign-in-aware call to
 * action, and the live competitor count.
 */
export default function Home() {
  return (
    <>
      <HeroIntro />
      {/* Unscaled, overflow-hidden wrapper: HeroIntro scales #hero-reveal-target
          up while it's hidden behind the closed doors, and a CSS transform's
          painted bounds aren't clipped by the element's own overflow-hidden —
          this outer box is what actually contains that spill. */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main id={HOMEPAGE_TARGET_ID} className="relative flex flex-1 flex-col overflow-hidden">
          <ThreeBackground />

          <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-28 text-center">
            <AnimatedIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs uppercase tracking-widest text-muted">
                <Suspense fallback={<>&nbsp;</>}>
                  <StatusBadge />
                </Suspense>
              </span>
            </AnimatedIn>

            <AnimatedIn delay={0.1}>
              <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-7xl">
                Lose weight.
                <br />
                <span className="text-gradient">Together.</span>
              </h1>
            </AnimatedIn>

            <AnimatedIn delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
                Log your weight daily, track your progress as a percentage, and see
                how you stack up against everyone else — live, on one leaderboard.
              </p>
            </AnimatedIn>

            <AnimatedIn delay={0.3}>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Suspense fallback={<div className="h-[52px] w-56" aria-hidden="true" />}>
                  <CallToAction />
                </Suspense>
              </div>
            </AnimatedIn>

            <AnimatedStagger
              className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-6"
              itemSelector=".stat"
            >
              <div className="stat glass rounded-2xl p-6">
                <div className="text-3xl font-semibold">
                  <Suspense fallback={<>—</>}>
                    <ParticipantCount />
                  </Suspense>
                </div>
                <div className="mt-1 text-sm text-muted">Competitors</div>
              </div>
              <div className="stat glass rounded-2xl p-6">
                <div className="text-3xl font-semibold">
                  <CountUp value={COMPETITION_TOTAL_DAYS} />
                </div>
                <div className="mt-1 text-sm text-muted">Total days</div>
              </div>
              <div className="stat glass rounded-2xl p-6">
                <div className="text-3xl font-semibold text-gradient">%</div>
                <div className="mt-1 text-sm text-muted">Ranked by change</div>
              </div>
            </AnimatedStagger>

            <AnimatedIn delay={0.2} className="mt-10">
              <p className="text-sm text-muted">
                {COMPETITION_START_DATE.toLocaleDateString("en-US", DATE_FMT)} —{" "}
                {COMPETITION_END_DATE.toLocaleDateString("en-US", DATE_FMT)}
              </p>
            </AnimatedIn>
          </section>
        </main>
      </div>
    </>
  );
}

// "Today" only exists at request time, so this can't be part of the shell.
async function StatusBadge() {
  await connection();
  const status = competitionStatus();
  const fallbackDays =
    status === "upcoming" ? daysUntilStart() : status === "active" ? daysRemaining() : 0;
  return <LiveCompetitionStatus fallbackStatus={status} fallbackDays={fallbackDays} variant="badge" />;
}

async function CallToAction() {
  const session = await getOptionalSession();

  if (session) {
    return (
      <Link
        href="/dashboard"
        className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-8 py-3.5 font-medium text-background transition-transform hover:scale-105"
      >
        Go to your dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-8 py-3.5 font-medium text-background transition-transform hover:scale-105"
      >
        Join the competition
      </Link>
      <Link
        href="/login"
        className="rounded-full border border-border px-8 py-3.5 font-medium text-foreground transition-colors hover:border-white/25"
      >
        I already have an account
      </Link>
    </>
  );
}

async function ParticipantCount() {
  await connection();
  const participantCount = await prisma.user.count();
  return <CountUp value={participantCount} />;
}
