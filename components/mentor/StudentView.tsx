"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Eye } from "lucide-react";
import KpiCards from "@/components/overview/KpiCards";
import EquityCurve from "@/components/overview/EquityCurve";
import { computeKpis, buildEquityCurve, computeCurrentEquity } from "@/lib/stats";
import type { Account, Trade, AccountTransaction } from "@/types/database";
import { fmtDate } from "@/lib/format";

export default function StudentView({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [menteeName, setMenteeName] = useState("Student");

  useEffect(() => {
    fetch(`/api/mentor/view/${accountId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAccount(data.account);
        setTrades(data.trades);
        setTransactions(data.transactions);
        setMenteeName(data.menteeName);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>{error ?? "Account not found"}</div>
      </div>
    );
  }

  const kpis = computeKpis(trades);
  const startBal = account.starting_balance ?? 0;
  const equity = computeCurrentEquity(trades, transactions, startBal);
  const curve = buildEquityCurve(trades, transactions, startBal);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-blue-300">Read-only mentor view</span>
        </div>
        <h1 className="mt-2 font-serif text-2xl">{menteeName} — {account.name}</h1>
        <p className="mt-1 text-xs text-slate-400">
          {account.broker ?? ""} · {account.currency}
        </p>
      </div>

      <KpiCards
        kpis={kpis}
        currency={account.currency}
        currentEquity={equity}
        startingBalance={startBal}
      />

      <EquityCurve
        data={curve}
        currency={account.currency}
        startingBalance={startBal}
      />

      {/* Recent trades table (read-only) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <h3 className="mb-3 font-serif text-lg">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400">Symbol</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400">Dir</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400">P&L</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trades.slice(0, 20).map((t) => {
                const net = (t.pnl ?? 0) - (t.commission ?? 0) - (t.swap ?? 0);
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${t.direction === "long" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-mono tabular-nums ${net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {net >= 0 ? "+" : ""}{net.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-400">
                      {t.close_time ? fmtDate(t.close_time) : "Open"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
