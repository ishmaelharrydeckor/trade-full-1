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
import type { Trade } from "@/types/database";

export default function RMultipleChart({ trades }: { trades: Trade[] }) {
  const bins = [
    { min: -Infinity, max: -2, label: "<-2R", count: 0, isPositive: false },
    { min: -2, max: -1, label: "-2R to -1R", count: 0, isPositive: false },
    { min: -1, max: 0, label: "-1R to 0R", count: 0, isPositive: false },
    { min: 0, max: 1, label: "0R to 1R", count: 0, isPositive: true },
    { min: 1, max: 2, label: "1R to 2R", count: 0, isPositive: true },
    { min: 2, max: 3, label: "2R to 3R", count: 0, isPositive: true },
    { min: 3, max: 4, label: "3R to 4R", count: 0, isPositive: true },
    { min: 4, max: Infinity, label: ">4R", count: 0, isPositive: true },
  ];

  let hasData = false;

  for (const t of trades) {
    const entry = Number(t.entry_price);
    const exit = t.exit_price ? Number(t.exit_price) : null;
    const sl = t.stop_loss ? Number(t.stop_loss) : null;
    if (!entry || !exit || !sl) continue;

    const riskDistance = Math.abs(entry - sl);
    if (riskDistance === 0) continue;

    const pnlDistance = t.direction === "long" ? (exit - entry) : (entry - exit);
    const rMultiple = pnlDistance / riskDistance;

    for (const bin of bins) {
      if (rMultiple >= bin.min && rMultiple < bin.max) {
        bin.count++;
        hasData = true;
        break;
      }
    }
  }

  if (!hasData) {
    return (
      <div className="rounded-xl p-5 lg:col-span-2" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <div className="mb-4">
          <h3 className="text-lg font-bold">R-Multiple</h3>
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Distribution of risk-multiple results for your trades
          </p>
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-center text-sm font-medium" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          Set Stop Loss (SL) on your trades to view R-multiple distribution.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 lg:col-span-2" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold">R-Multiple</h3>
        <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Distribution of risk-multiple results for your trades
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="h-64 w-full md:min-w-0" style={{ minWidth: "500px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bins}
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
              />
              <YAxis
                stroke="var(--text-muted)"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
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
                formatter={(value: number) => [
                  `${value} trade${value !== 1 ? "s" : ""}`,
                  "Trades count",
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {bins.map((d, idx) => (
                  <Cell
                    key={idx}
                    fill={d.isPositive ? 'var(--positive)' : 'var(--negative)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
