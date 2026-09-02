"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { ChartRow } from "@/lib/leaderboard";

type Participant = { id: string; fullName: string };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number | null; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload
    .filter((p) => p.value !== null && p.value !== undefined)
    .sort((a, b) => (a.value as number) - (b.value as number));

  if (rows.length === 0) return null;

  return (
    <div className="glass max-h-64 overflow-auto rounded-xl px-4 py-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">{label}</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.name}
            </span>
            <span
              className="font-mono tabular-nums"
              style={{ color: (row.value as number) <= 0 ? "var(--accent)" : "var(--danger)" }}
            >
              {(row.value as number) > 0 ? "+" : ""}
              {(row.value as number).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeightChart({
  data,
  participants,
  colorMap,
}: {
  data: ChartRow[];
  participants: Participant[];
  colorMap: Record<string, string>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        No weigh-ins logged yet. Be the first!
      </div>
    );
  }

  return (
    <div className="h-80 w-full sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            minTickGap={24}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            width={56}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" />
          <Tooltip content={<CustomTooltip />} />
          {participants.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {participants.map((p) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.fullName}
              stroke={colorMap[p.id]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
