"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { fmtSignedUsd, fmtPct } from "@/lib/format";
import type { DimensionAggregate } from "@/lib/analytics";

interface Props {
  title: string;
  subtitle?: string;
  data: DimensionAggregate[];
  emptyMessage?: string;
}

const COLORS = ["#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#10b981", "#f59e0b"];

export default function AnalyticsDonutChart({
  title,
  subtitle,
  data,
  emptyMessage = "Not enough data yet.",
}: Props) {
  const isEmpty = data.length === 0;

  // Filter out items with 0 trades for rendering cleanliness
  const chartData = data.filter((d) => d.trades > 0);

  // Compute central metrics
  const totalTrades = chartData.reduce((acc, curr) => acc + curr.trades, 0);
  const avgWinRate = totalTrades > 0
    ? chartData.reduce((acc, curr) => acc + (curr.winRate * curr.trades), 0) / totalTrades
    : 0;

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      {isEmpty || chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-center text-sm font-medium" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          {emptyMessage}
        </div>
      ) : (
        <div className="relative h-64 w-full">
          {/* Centered KPI text inside the donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
            <span className="text-2xl font-bold tracking-tight text-[color:var(--text-primary)]">
              {totalTrades}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
              Trades
            </span>
            <span className="text-xs font-semibold text-emerald-400 mt-0.5">
              {fmtPct(avgWinRate, 0)} Win
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="trades"
                nameKey="label"
              >
                {chartData.map((d, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none stroke-transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(value: number, name: string, props: any) => {
                  const payload = props.payload as DimensionAggregate;
                  return [
                    `${value} trades (${fmtPct(payload.winRate, 0)} Win) · P&L: ${fmtSignedUsd(payload.netPnl)}`,
                    payload.label,
                  ];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "var(--text-secondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
