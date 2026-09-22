"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  Cell,
} from "recharts";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import type { ReactNode } from "react";

type Row = {
  userId: string;
  name: string;
  progress: number;
  goalPercent: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;

  return (
    <div className="glass rounded-xl px-4 py-3 text-sm shadow-xl">
      <div className="font-medium text-foreground">{row.name}</div>
      <div className="mt-1 font-mono tabular-nums text-muted">
        {Math.round(row.progress)}% of the way to a {row.goalPercent}% goal
      </div>
    </div>
  );
}

export function GoalProgressChart({
  entries,
  colorMap,
}: {
  entries: LeaderboardEntry[];
  colorMap: Record<string, string>;
}) {
  const rows: Row[] = entries
    .filter((e): e is LeaderboardEntry & { goalProgressPercent: number; goalPercent: number } =>
      e.goalProgressPercent !== null && e.goalPercent !== null
    )
    .map((e) => ({
      userId: e.userId,
      name: e.fullName,
      progress: Math.min(100, Math.max(0, e.goalProgressPercent)),
      goalPercent: e.goalPercent,
    }))
    .sort((a, b) => b.progress - a.progress);

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No one has set a goal yet.
      </div>
    );
  }

  const height = Math.max(120, rows.length * 40 + 40);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 36, bottom: 0, left: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={112}
          />
          <ReferenceLine x={100} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.userId} fill={colorMap[row.userId]} />
            ))}
            <LabelList
              dataKey="progress"
              position="right"
              formatter={(value: ReactNode) => `${Math.round(Number(value))}%`}
              fill="var(--muted)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
