"use client";

// components/overview/EquityCurve.tsx
// Renders cumulative equity + drawdown overlay using Recharts.
// Handles 0-trade and 1-trade edge cases gracefully.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface EquityPoint {
  index: number;
  equity: number;
  drawdown: number;
}

interface EquityCurveProps {
  data: EquityPoint[];
  height?: number;
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ height: 180 }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-gray-600"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <p className="text-sm text-gray-500">
        Log at least 2 trades to see your equity curve.
      </p>
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: number;
}) => {
  if (!active || !payload?.length) return null;

  const equity = payload.find((p) => p.name === "equity");
  const drawdown = payload.find((p) => p.name === "drawdown");

  return (
    <div className="bg-[#131b2e] border border-[#1e2a42] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">Trade #{label}</p>
      {equity && (
        <p className={equity.value >= 0 ? "text-emerald-400" : "text-red-400"}>
          Equity: {equity.value >= 0 ? "+" : ""}
          {equity.value.toFixed(2)}
        </p>
      )}
      {drawdown && drawdown.value > 0 && (
        <p className="text-orange-400">Drawdown: -{drawdown.value.toFixed(1)}%</p>
      )}
    </div>
  );
};

export default function EquityCurve({ data, height = 220 }: EquityCurveProps) {
  // Need at least 2 points to draw a meaningful curve
  if (!data || data.length < 2) {
    return <EmptyState />;
  }

  const minEquity = Math.min(...data.map((d) => d.equity));
  const maxEquity = Math.max(...data.map((d) => d.equity));
  const padding = (maxEquity - minEquity) * 0.1 || 10;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" vertical={false} />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          label={{ value: "Trades", position: "insideBottom", offset: -2, fontSize: 11, fill: "#6b7280" }}
        />
        <YAxis
          domain={[minEquity - padding, maxEquity + padding]}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="equity"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
          name="equity"
        />
        <Line
          type="monotone"
          dataKey="drawdown"
          stroke="#f97316"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#f97316" }}
          strokeOpacity={0.6}
          name="drawdown"
          yAxisId={0}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
