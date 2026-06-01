// components/dashboard/AccountDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import AccountTabs, { type TabId } from "./AccountTabs";
import DateRangeFilter, {
  ALL_TIME,
  type DateRange,
  filterTradesByDateRange,
  filterTxByDateRange,
} from "./DateRangeFilter";
import OverviewTab from "@/components/account/tabs/OverviewTab";
import TradesTab from "@/components/account/tabs/TradesTab";
import AccountTab from "@/components/account/tabs/AccountTab";
import AnalyticsTab from "@/components/account/tabs/AnalyticsTab";
import CalendarTab from "@/components/account/tabs/CalendarTab";
import type {
  Account,
  Trade,
  AccountTransaction,
  AccountSettings,
} from "@/types/database";

// Date filter applies to these tabs only. Calendar IS a date-driven view
// (so doesn't need it). Account tab shows settings (not date-driven).
const FILTERED_TABS: TabId[] = ["overview", "trades", "analytics"];

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
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);

  const filteredTrades = useMemo(
    () => filterTradesByDateRange(trades, dateRange),
    [trades, dateRange]
  );
  const filteredTransactions = useMemo(
    () => filterTxByDateRange(transactions, dateRange),
    [transactions, dateRange]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as TabId;
      if (detail) setTab(detail);
    };
    window.addEventListener("tradefull:gototab", handler);
    return () => window.removeEventListener("tradefull:gototab", handler);
  }, []);

  const showFilter = FILTERED_TABS.includes(tab);
  const tradesForTab = showFilter ? filteredTrades : trades;
  const txForTab = showFilter ? filteredTransactions : transactions;

  return (
    <div className="flex flex-col gap-6">
      <AccountTabs active={tab} onSelect={setTab} />

      {showFilter && (
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          tradeCount={filteredTrades.length}
        />
      )}

      {tab === "overview" && (
        <OverviewTab
          account={account}
          trades={tradesForTab}
          transactions={txForTab}
        />
      )}

      {tab === "trades" && (
        <TradesTab account={account} trades={tradesForTab} />
      )}

      {tab === "analytics" && (
        <AnalyticsTab account={account} trades={tradesForTab} />
      )}

      {tab === "calendar" && (
        <CalendarTab account={account} trades={trades} />
      )}

      {tab === "account" && (
        <AccountTab
          account={account}
          trades={trades}
          transactions={transactions}
          settings={settings}
        />
      )}
    </div>
  );
}
