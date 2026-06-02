"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { EquityPoint } from "@/lib/stats";
import { computeDrawdown } from "@/lib/stats";
import { fmtPct, fmtSignedUsd } from "@/lib/format";
import { TrendingDown } from "lucide-react";

export default function DrawdownChart({
  equityCurve,
}: {
  equityCurve: EquityPoint[];
}) {
  const dd = computeDrawdown(equityCurve);

  // Build chart data: at each equity point, compute drawdown from peak
  const chartData: { time: string; drawdown: number; drawdownAbs: number }[] = [];
  let peak = equityCurve.length > 0 ? equityCurve[0].equity : 0;

  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const ddPct = peak > 0 ? -((peak - point.equity) / peak) * 100 : 0;
    const ddAbs = -(peak - point.equity);
    chartData.push({
      time: point.time,
      drawdown: Math.round(ddPct * 100) / 100,
      drawdownAbs: Math.round(ddAbs * 100) / 100,
    });
  }

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-red-400" />
        <h3 className="font-serif text-lg">Drawdown</h3>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
          <span>
            Max: <span className="font-mono text-red-300">{fmtPct(dd.maxDrawdownPct, 1)}</span>
            {" "}({fmtSignedUsd(-dd.maxDrawdownAbs)})
          </span>
          {dd.currentDrawdownPct > 0 && (
            <span>
              Current: <span className="font-mono text-amber-300">{fmtPct(dd.currentDrawdownPct, 1)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              stroke="rgba(255,255,255,0.1)"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              stroke="rgba(255,255,255,0.1)"
              domain={["dataMin", 0]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#131b2e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => {
                if (name === "drawdown") return [`${value.toFixed(2)}%`, "Drawdown"];
                return [value, name];
              }}
              labelFormatter={(label: string) => {
                const d = new Date(label);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              }}
            />
            <ReferenceLine y={-5} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={-20} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#ddGradient)"
              dot={false}
              activeDot={{ r: 3, fill: "#ef4444" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
