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
    <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      {isEmpty ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-center text-sm font-medium" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
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
                  stroke="var(--app-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={displayData.length > 6 ? -30 : 0}
                  textAnchor={displayData.length > 6 ? "end" : "middle"}
                  height={displayData.length > 6 ? 60 : 30}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => fmtCompactNumber(v)}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: 4 }}
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
                <Bar dataKey="netPnl" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {displayData.map((d, idx) => (
                    <Cell
                      key={idx}
                      fill={d.netPnl >= 0 ? 'var(--positive)' : 'var(--negative)'}
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
