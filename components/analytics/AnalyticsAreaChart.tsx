"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fmtSignedUsd, fmtCompactNumber, fmtPct } from "@/lib/format";
import type { DimensionAggregate } from "@/lib/analytics";

interface Props {
  title: string;
  subtitle?: string;
  data: DimensionAggregate[];
  emptyMessage?: string;
}

export default function AnalyticsAreaChart({
  title,
  subtitle,
  data,
  emptyMessage = "Not enough data yet.",
}: Props) {
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 12, left: -10, bottom: 4 }}
            >
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                interval={data.length > 12 ? 2 : 0}
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
                contentStyle={{
                  backgroundColor: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: 4, fontWeight: "bold" }}
                labelFormatter={(label, payload) => {
                  const p = payload?.[0]?.payload as DimensionAggregate | undefined;
                  if (!p) return label as string;
                  return `${label} · ${p.trades} trade${p.trades !== 1 ? "s" : ""} · ${fmtPct(p.winRate, 0)} win`;
                }}
                formatter={(value: number) => [fmtSignedUsd(value), "Net P&L"]}
              />
              <Area
                type="monotone"
                dataKey="netPnl"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#areaColor)"
                strokeWidth={2}
                activeDot={{ r: 6, stroke: "var(--app-surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
