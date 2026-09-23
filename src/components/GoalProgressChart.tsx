"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry, GoalRaceStep } from "@/lib/leaderboard";

const ROW_HEIGHT = 40;
const TOTAL_DURATION_MS = 8400; // matches the leaderboard line chart's own draw-in pacing
const MIN_STEP_MS = 180;

type Row = {
  userId: string;
  name: string;
  goalPercent: number;
  progress: number;
};

// Keyed by replayToken so each (re)play gets a fresh mount — that's what
// resets stepIndex back to 0, rather than an effect calling setState on an
// already-mounted instance.
function GoalRace({
  entries,
  raceSteps,
  colorMap,
}: {
  entries: LeaderboardEntry[];
  raceSteps: GoalRaceStep[];
  colorMap: Record<string, string>;
}) {
  const byUserId = new Map(entries.map((e) => [e.userId, e]));
  const participantCount = new Set(raceSteps.flatMap((s) => Object.keys(s.progress))).size;

  const [stepIndex, setStepIndex] = useState(0);
  const stepMs = Math.max(MIN_STEP_MS, TOTAL_DURATION_MS / Math.max(1, raceSteps.length - 1));

  useEffect(() => {
    if (raceSteps.length <= 1) return;

    let i = 0;
    const timeoutRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

    function tick() {
      i += 1;
      setStepIndex(i);
      if (i < raceSteps.length - 1) {
        timeoutRef.current = setTimeout(tick, stepMs);
      }
    }
    timeoutRef.current = setTimeout(tick, stepMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount (see key on GoalRace)
  }, []);

  const step = raceSteps[Math.min(stepIndex, raceSteps.length - 1)];
  const isLastStep = stepIndex >= raceSteps.length - 1;

  const rows: Row[] = Object.entries(step.progress)
    .map(([userId, progress]) => {
      const entry = byUserId.get(userId);
      return {
        userId,
        name: entry?.fullName ?? "?",
        goalPercent: entry?.goalPercent ?? 0,
        progress,
      };
    })
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));

  return (
    <div>
      <div className="text-xs text-muted">
        As of <span className="font-medium text-foreground">{step.label}</span>
      </div>

      <div className="relative mt-3" style={{ height: participantCount * ROW_HEIGHT }}>
        {rows.map((row, i) => (
          <div
            key={row.userId}
            className="absolute inset-x-0 flex items-center gap-3"
            style={{
              height: ROW_HEIGHT,
              transform: `translateY(${i * ROW_HEIGHT}px)`,
              transition: `transform ${isLastStep ? 400 : stepMs}ms ease`,
            }}
            title={`${Math.round(row.progress)}% of the way to a ${row.goalPercent}% goal`}
          >
            <div className="w-24 shrink-0 truncate text-xs text-muted sm:w-28">{row.name}</div>
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.progress}%`,
                  backgroundColor: colorMap[row.userId],
                  transition: `width ${stepMs}ms linear`,
                }}
              />
            </div>
            <div className="w-10 shrink-0 text-right font-mono text-xs text-muted">
              {Math.round(row.progress)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoalProgressChart({
  entries,
  raceSteps,
  colorMap,
}: {
  entries: LeaderboardEntry[];
  raceSteps: GoalRaceStep[];
  colorMap: Record<string, string>;
}) {
  const [replayToken, setReplayToken] = useState(0);

  if (raceSteps.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No one has set a goal yet.
      </div>
    );
  }

  return (
    <div>
      {raceSteps.length > 1 && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setReplayToken((t) => t + 1)}
            className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-white/25 hover:text-foreground"
          >
            ↻ Replay
          </button>
        </div>
      )}
      <GoalRace key={replayToken} entries={entries} raceSteps={raceSteps} colorMap={colorMap} />
    </div>
  );
}
