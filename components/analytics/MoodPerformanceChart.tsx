// components/analytics/MoodPerformanceChart.tsx
"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { fmtSignedUsd, fmtCompactNumber, fmtPct } from "@/lib/format";

interface MoodData {
  mood: string;
  tradeCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
}

interface Props {
  data: MoodData[];
}

export default function MoodPerformanceChart({ data }: Props) {
  const isEmpty = data.length === 0;

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-6">
        <h3 className="text-lg font-bold">Mood vs. Performance</h3>
        <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Correlation of daily journal mood/mental state with trading outcome metrics
        </p>
      </div>

      {isEmpty ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed text-center text-sm font-medium" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          Tag your daily journals or trade mindset tags to see mood performance analytics.
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="h-72 min-w-[500px] md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                
                <XAxis
                  dataKey="mood"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis
                  yAxisId="left"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(val) => fmtCompactNumber(val)}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  domain={[0, 100]}
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
                  formatter={(value: any, name: string) => {
                    if (name === "Net P&L") return [fmtSignedUsd(Number(value)), name];
                    if (name === "Win Rate") return [`${value}%`, name];
                    return [value, name];
                  }}
                />
                
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                />

                <Bar 
                  yAxisId="left"
                  name="Net P&L"
                  dataKey="netPnl" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.netPnl >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>

                <Line
                  yAxisId="right"
                  name="Win Rate"
                  type="monotone"
                  dataKey="winRate"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: "#6366f1", strokeWidth: 2, fill: "var(--app-surface)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
