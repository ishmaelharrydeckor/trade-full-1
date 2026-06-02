"use client";

// components/overview/OpenPositions.tsx
// Polls the EA open-positions endpoint every 8 seconds.
// IMPORTANT: interval is cleared on unmount to prevent memory leaks
// and stale-closure updates after the user navigates away.

import { useEffect, useRef, useState } from "react";

interface Position {
  ticket: number;
  symbol: string;
  type: "buy" | "sell";
  lots: number;
  openPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  openTime: string;
}

interface OpenPositionsProps {
  accountId: string;
}

export default function OpenPositions({ accountId }: OpenPositionsProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use a ref so the interval callback always has access to the latest accountId
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;

  useEffect(() => {
    let cancelled = false;

    async function fetchPositions() {
      try {
        const res = await fetch(
          `/api/ea/positions?accountId=${accountIdRef.current}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setPositions(json.positions ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Could not load open positions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPositions();

    const interval = setInterval(fetchPositions, 8_000);

    // Cleanup — critical: prevents the interval from running after unmount
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accountId]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center animate-pulse">
        Loading positions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 py-4 text-center">{error}</div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        No open positions right now.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-[#1e2a42]">
            <th className="text-left py-2 px-3 font-medium">Symbol</th>
            <th className="text-left py-2 px-3 font-medium">Type</th>
            <th className="text-right py-2 px-3 font-medium">Lots</th>
            <th className="text-right py-2 px-3 font-medium">Open</th>
            <th className="text-right py-2 px-3 font-medium">Current</th>
            <th className="text-right py-2 px-3 font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.ticket}
              className="border-b border-[#1e2a42] last:border-0"
            >
              <td className="py-2 px-3 font-medium text-white">{pos.symbol}</td>
              <td className="py-2 px-3">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    pos.type === "buy"
                      ? "bg-emerald-900/40 text-emerald-400"
                      : "bg-red-900/40 text-red-400"
                  }`}
                >
                  {pos.type.toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-3 text-right text-gray-300">
                {pos.lots.toFixed(2)}
              </td>
              <td className="py-2 px-3 text-right text-gray-400">
                {pos.openPrice}
              </td>
              <td className="py-2 px-3 text-right text-gray-300">
                {pos.currentPrice}
              </td>
              <td
                className={`py-2 px-3 text-right font-medium ${
                  pos.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pos.unrealizedPnl >= 0 ? "+" : ""}
                {pos.unrealizedPnl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
