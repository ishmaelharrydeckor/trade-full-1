// components/account/tabs/OverviewTab.tsx
"use client";

import { useMemo } from "react";
import type { Account, Trade, AccountTransaction } from "@/types/database";
import { computeKpis, buildEquityCurve, computeCurrentEquity } from "@/lib/stats";
import KpiCards from "@/components/overview/KpiCards";
import EquityCurve from "@/components/overview/EquityCurve";
import RecentTradesPreview from "@/components/overview/RecentTradesPreview";

export default function OverviewTab({
  account,
  trades,
  transactions,
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
}) {
  const startingBalance = account.starting_balance ?? 0;

  const kpis = useMemo(() => computeKpis(trades), [trades]);
  const equityCurve = useMemo(
    () => buildEquityCurve(trades, transactions, startingBalance),
    [trades, transactions, startingBalance]
  );
  const currentEquity = useMemo(
    () => computeCurrentEquity(trades, transactions, startingBalance),
    [trades, transactions, startingBalance]
  );

  return (
    <div className="flex flex-col gap-6">
      <KpiCards
        kpis={kpis}
        currency={account.currency}
        currentEquity={currentEquity}
        startingBalance={account.starting_balance}
      />

      <EquityCurve
        data={equityCurve}
        currency={account.currency}
        startingBalance={account.starting_balance}
      />

      <RecentTradesPreview
        trades={trades}
        onOpenAll={() => {
          // Switch to the Trades tab. We dispatch a custom event the
          // parent dashboard listens for; simpler than prop-drilling
          // a setter into deeply nested components.
          window.dispatchEvent(new CustomEvent("tradefull:gototab", { detail: "trades" }));
        }}
      />
    </div>
  );
}
