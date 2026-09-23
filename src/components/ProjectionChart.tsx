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
import { dateKeyToLabel } from "@/lib/competition";
import { PROJECTION_MODELS } from "@/lib/projections";

const MODEL_COLORS: Record<string, string> = {
  straightLine: "var(--accent)",
  lastWeek: "#38bdf8",
  lastMonth: "#f59e0b",
};

type Row = {
  dateKey: string;
  label: string;
  actual: number | null;
  straightLine: number | null;
  lastWeek: number | null;
  lastMonth: number | null;
};

function buildRows(
  series: { dateKey: string; percentChange: number }[],
  projections: { straightLine: number | null; lastWeek: number | null; lastMonth: number | null },
  endDateKey: string
): Row[] {
  const rows: Row[] = series.map((p) => ({
    dateKey: p.dateKey,
    label: dateKeyToLabel(p.dateKey),
    actual: p.percentChange,
    straightLine: null,
    lastWeek: null,
    lastMonth: null,
  }));

  if (rows.length === 0) return rows;

  // Seed each projection ray at the last actual point so the dashed lines
  // visually connect to the solid history line, then a single end point
  // per model at the competition's end date.
  const last = rows[rows.length - 1];
  last.straightLine = last.actual;
  last.lastWeek = last.actual;
  last.lastMonth = last.actual;

  if (endDateKey > last.dateKey) {
    rows.push({
      dateKey: endDateKey,
      label: dateKeyToLabel(endDateKey),
      actual: null,
      straightLine: projections.straightLine,
      lastWeek: projections.lastWeek,
      lastMonth: projections.lastMonth,
    });
  }

  return rows;
}

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
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (rows.length === 0) return null;

  return (
    <div className="glass rounded-xl px-4 py-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">{label}</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.name}
            </span>
            <span
              className="font-mono tabular-nums"
              style={{ color: (row.value as number) <= 0 ? "var(--accent)" : "var(--danger)" }}
            >
              {(row.value as number) > 0 ? "+" : ""}
              {(row.value as number).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectionChart({
  series,
  projections,
  endDateKey,
}: {
  series: { dateKey: string; percentChange: number }[];
  projections: { straightLine: number | null; lastWeek: number | null; lastMonth: number | null };
  endDateKey: string;
}) {
  const data = buildRows(series, projections, endDateKey);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        Log a couple of weigh-ins to see your projections.
      </div>
    );
  }

  return (
    <div>
      <div className="h-72 w-full overflow-hidden sm:h-80">
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
              tickFormatter={(v: number) => `${v.toFixed(2)}%`}
              width={64}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} iconType="plainline" />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="var(--foreground)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="linear"
              dataKey="straightLine"
              name="Straight line"
              stroke={MODEL_COLORS.straightLine}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
            <Line
              type="linear"
              dataKey="lastWeek"
              name="Last 7 days"
              stroke={MODEL_COLORS.lastWeek}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
            <Line
              type="linear"
              dataKey="lastMonth"
              name="Last 30 days"
              stroke={MODEL_COLORS.lastMonth}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PROJECTION_MODELS.map((model) => (
          <div key={model.key} className="rounded-xl border border-border bg-surface-2/50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: MODEL_COLORS[model.key] }}
              />
              {model.label}
            </div>
            <p className="mt-1 text-xs text-muted">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
