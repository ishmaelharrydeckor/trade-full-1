// components/dashboard/AccountDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import AccountTabs, { type TabId } from "./AccountTabs";
import OverviewTab from "@/components/account/tabs/OverviewTab";
import TradesTab from "@/components/account/tabs/TradesTab";
import AccountTab from "@/components/account/tabs/AccountTab";
import ComingSoonTab from "@/components/account/tabs/ComingSoonTab";
import type {
  Account,
  Trade,
  AccountTransaction,
  AccountSettings,
} from "@/types/database";

export default function AccountDashboard({
  account,
  trades,
  transactions,
  settings,
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
  settings: AccountSettings | null;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  // Listen for cross-tab navigation events from child components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as TabId;
      if (detail) setTab(detail);
    };
    window.addEventListener("tradefull:gototab", handler);
    return () => window.removeEventListener("tradefull:gototab", handler);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <AccountTabs active={tab} onSelect={setTab} />

      {tab === "overview" && (
        <OverviewTab
          account={account}
          trades={trades}
          transactions={transactions}
        />
      )}

      {tab === "trades" && (
        <TradesTab account={account} trades={trades} />
      )}

      {tab === "account" && (
        <AccountTab
          account={account}
          transactions={transactions}
          settings={settings}
        />
      )}

      {tab === "analytics" && (
        <ComingSoonTab
          title="Analytics"
          description="Pair performance, weekday/hour distribution, mindset breakdown, tag analysis, and 8 more charts. Shipping in M2.2 next week."
        />
      )}

      {tab === "calendar" && (
        <ComingSoonTab
          title="Calendar"
          description="Heatmap of daily P&L, click any day to see that day's trades. Shipping in M2.2."
        />
      )}
    </div>
  );
}
