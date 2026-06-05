"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { fmtSignedUsd, fmtPct } from "@/lib/format";
import type { DimensionAggregate } from "@/lib/analytics";

interface Props {
  title: string;
  subtitle?: string;
  data: DimensionAggregate[];
  emptyMessage?: string;
}

export default function AnalyticsRadarChart({
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
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="var(--app-border)" gridType="polygon" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: "600" }} />
              <PolarRadiusAxis angle={30} domain={["auto", "auto"]} tick={{ fill: "var(--text-muted)", fontSize: 8 }} axisLine={false} />
              <Radar
                name="Net P&L"
                dataKey="netPnl"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
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
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
