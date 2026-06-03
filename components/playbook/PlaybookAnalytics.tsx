"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Playbook, Trade, TradePlaybookEntry, PlaybookRule } from "@/types/database";
import { tradeNetPnl } from "@/lib/stats";
import { fmtSignedUsd, fmtPct, fmtNumber } from "@/lib/format";
import { BarChart3, CheckCircle, XCircle } from "lucide-react";

interface PlaybookStat {
  name: string;
  trades: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  ruleCompliance: number; // avg % of rules followed per trade
}

export default function PlaybookAnalytics({
  playbooks,
  trades,
  entries,
}: {
  playbooks: Playbook[];
  trades: Trade[];
  entries: TradePlaybookEntry[];
}) {
  const stats = useMemo(() => {
    const result: PlaybookStat[] = [];

    for (const pb of playbooks) {
      const pbEntries = entries.filter((e) => e.playbook_id === pb.id);
      const tradeIds = new Set(pbEntries.map((e) => e.trade_id));
      const pbTrades = trades.filter((t) => tradeIds.has(t.id));

      if (pbTrades.length === 0) {
        result.push({
          name: pb.name,
          trades: 0,
          netPnl: 0,
          winRate: 0,
          profitFactor: 0,
          ruleCompliance: 0,
        });
        continue;
      }

      let winners = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let totalPnl = 0;

      for (const t of pbTrades) {
        const net = tradeNetPnl(t);
        totalPnl += net;
        if (net > 0) {
          winners++;
          grossProfit += net;
        } else if (net < 0) {
          grossLoss += Math.abs(net);
        }
      }

      const totalRules = (pb.rules as PlaybookRule[]).length;
      let complianceSum = 0;
      for (const entry of pbEntries) {
        if (totalRules > 0) {
          complianceSum += (entry.rules_followed.length / totalRules) * 100;
        }
      }

      result.push({
        name: pb.name,
        trades: pbTrades.length,
        netPnl: totalPnl,
        winRate: (winners / pbTrades.length) * 100,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        ruleCompliance: pbEntries.length > 0 ? complianceSum / pbEntries.length : 0,
      });
    }

    return result.sort((a, b) => b.netPnl - a.netPnl);
  }, [playbooks, trades, entries]);

  if (stats.length === 0 || stats.every((s) => s.trades === 0)) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center backdrop-blur" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
        <BarChart3 className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tag trades to your playbooks to see performance analytics here.
        </p>
      </div>
    );
  }

  const chartData = stats.filter((s) => s.trades > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        <h3 className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>Strategy Performance</h3>
      </div>

      {/* P&L by strategy chart */}
      <div className="rounded-2xl p-5 backdrop-blur" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                stroke="var(--app-border)"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                stroke="var(--app-border)"
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--app-elevated)",
                  border: "1px solid var(--app-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                }}
                formatter={(v: number) => [fmtSignedUsd(v), "Net P&L"]}
              />
              <Bar dataKey="netPnl" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.netPnl >= 0 ? "var(--positive)" : "var(--negative)"} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats table */}
      <div className="overflow-x-auto rounded-xl backdrop-blur" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
              <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Strategy</th>
              <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Trades</th>
              <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Net P&L</th>
              <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Win Rate</th>
              <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>PF</th>
              <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Rule Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
            {stats.filter((s) => s.trades > 0).map((s) => (
              <tr key={s.name} className="transition" style={{ borderBottom: '1px solid var(--app-border)' }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>{s.trades}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: s.netPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  {fmtSignedUsd(s.netPnl)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmtPct(s.winRate, 1)}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {s.profitFactor === Infinity ? "∞" : fmtNumber(s.profitFactor, 2)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {s.ruleCompliance >= 80 ? (
                      <CheckCircle className="h-3 w-3" style={{ color: 'var(--positive)' }} />
                    ) : (
                      <XCircle className="h-3 w-3" style={{ color: 'var(--warning)' }} />
                    )}
                    <span className="font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {fmtPct(s.ruleCompliance, 0)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
