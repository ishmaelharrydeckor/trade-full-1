// components/account/tabs/OverviewTab.tsx
"use client";

import { useMemo } from "react";
import type { Account, Trade, AccountTransaction, Playbook, TradePlaybookEntry } from "@/types/database";
import { computeKpis, buildEquityCurve, computeCurrentEquity } from "@/lib/stats";
import KpiCards from "@/components/overview/KpiCards";
import EquityCurve from "@/components/overview/EquityCurve";
import DrawdownChart from "@/components/overview/DrawdownChart";
import RecentTradesPreview from "@/components/overview/RecentTradesPreview";
import OpenPositionsPanel from "@/components/overview/OpenPositionsPanel";
import AiInsightsPanel from "@/components/insights/AiInsightsPanel";
import ScientificOverviewHeader from "@/components/overview/ScientificOverviewHeader";

export default function OverviewTab({
  account,
  trades,
  transactions,
  playbooks,
  playbookEntries,
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
  playbooks: Playbook[];
  playbookEntries: TradePlaybookEntry[];
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
      <OpenPositionsPanel accountId={account.id} />

      <ScientificOverviewHeader
        account={account}
        trades={trades}
        playbooks={playbooks}
        entries={playbookEntries}
      />

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

      <DrawdownChart equityCurve={equityCurve} />

      <AiInsightsPanel accountId={account.id} hasTrades={trades.length > 0} />

      <RecentTradesPreview
        trades={trades}
        onOpenAll={() => {
          window.dispatchEvent(
            new CustomEvent("tradefull:gototab", { detail: "trades" })
          );
        }}
      />
    </div>
  );
}

