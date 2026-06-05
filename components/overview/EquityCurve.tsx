// components/overview/EquityCurve.tsx
"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { EquityPoint } from "@/lib/stats";
import { fmtSignedUsd, fmtCompactNumber, fmtDateTime } from "@/lib/format";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function EquityCurve({
  data,
  currency,
  startingBalance,
}: {
  data: EquityPoint[];
  currency: string;
  startingBalance: number | null;
}) {
  const isEmpty = data.length <= 1;
  const last = data[data.length - 1];
  const isPositive = last && startingBalance ? last.equity >= startingBalance : true;

  if (isEmpty) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Equity curve</h3>
        </div>
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed text-sm" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          Add your first trade to see the equity curve.
        </div>
      </div>
    );
  }

  const stroke = isPositive ? "#22c55e" : "#ef4444";
  const fillGradient = isPositive ? "equityFillUp" : "equityFillDown";

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-bold">Equity curve</h3>
          <InfoTooltip text="Your account balance over time, adjusted for each trade's P&L plus deposits and withdrawals. An upward slope means you're growing your account." />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span style={{ color: 'var(--text-secondary)' }}>{currency}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="h-72 w-full min-w-[600px] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFillUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="equityFillDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={(iso) => {
                  try {
                    const d = new Date(iso);
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  } catch {
                    return "";
                  }
                }}
                stroke="#475569"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke="#475569"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => fmtCompactNumber(v)}
                tickLine={false}
                axisLine={false}
                width={50}
                domain={["auto", "auto"]}
              />
              {startingBalance != null && (
                <ReferenceLine
                  y={startingBalance}
                  stroke="#475569"
                  strokeDasharray="4 4"
                  label={{
                    value: "Start",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "left",
                  }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                labelFormatter={(iso) => fmtDateTime(iso as string)}
                formatter={(value: number, _name, props) => {
                  const point = props.payload as EquityPoint;
                  return [
                    fmtSignedUsd(value),
                    point.label
                      ? `Equity (after ${point.label})`
                      : "Equity",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={stroke}
                fill={`url(#${fillGradient})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
