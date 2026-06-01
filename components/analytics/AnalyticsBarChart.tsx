// components/analytics/AnalyticsBarChart.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { fmtSignedUsd, fmtCompactNumber, fmtPct } from "@/lib/format";
import type { DimensionAggregate } from "@/lib/analytics";

interface Props {
  title: string;
  subtitle?: string;
  data: DimensionAggregate[];
  emptyMessage?: string;
  maxItems?: number;
  span?: 1 | 2;       // grid column span (default 1)
}

export default function AnalyticsBarChart({
  title,
  subtitle,
  data,
  emptyMessage = "Not enough data yet.",
  maxItems,
}: Props) {
  const displayData = maxItems ? data.slice(0, maxItems) : data;
  const isEmpty = data.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-4">
        <h3 className="font-serif text-lg">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {isEmpty ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="h-64 w-full md:min-w-0"
            style={{ minWidth: Math.max(400, displayData.length * 60) + "px" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#475569"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={displayData.length > 6 ? -30 : 0}
                  textAnchor={displayData.length > 6 ? "end" : "middle"}
                  height={displayData.length > 6 ? 60 : 30}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => fmtCompactNumber(v)}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: "#0f1623",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as
                      | DimensionAggregate
                      | undefined;
                    if (!p) return label as string;
                    return `${label} · ${p.trades} trade${p.trades !== 1 ? "s" : ""} · ${fmtPct(p.winRate, 0)} win`;
                  }}
                  formatter={(value: number) => [
                    fmtSignedUsd(value),
                    "Net P&L",
                  ]}
                />
                <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                  {displayData.map((d, idx) => (
                    <Cell
                      key={idx}
                      fill={d.netPnl >= 0 ? "#22c55e" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
