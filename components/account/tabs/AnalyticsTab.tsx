// components/account/tabs/AnalyticsTab.tsx
"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  aggregateByAssetClass,
  aggregateBySymbol,
  aggregateByWeekday,
  aggregateByHour,
  aggregateByDirection,
  aggregateByMindset,
  aggregateByTags,
} from "@/lib/analytics";
import AnalyticsBarChart from "@/components/analytics/AnalyticsBarChart";
import RMultipleChart from "@/components/analytics/RMultipleChart";
import type { Account, Trade } from "@/types/database";

export default function AnalyticsTab({
  account,
  trades,
}: {
  account: Account;
  trades: Trade[];
}) {
  const byAssetClass = useMemo(() => aggregateByAssetClass(trades), [trades]);
  const bySymbol     = useMemo(() => aggregateBySymbol(trades), [trades]);
  const byWeekday    = useMemo(() => aggregateByWeekday(trades), [trades]);
  const byHour       = useMemo(() => aggregateByHour(trades), [trades]);
  const byDirection  = useMemo(() => aggregateByDirection(trades), [trades]);
  const byMindset    = useMemo(() => aggregateByMindset(trades), [trades]);
  const byTags       = useMemo(() => aggregateByTags(trades), [trades]);

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}>
        <BarChart3 className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-2xl font-bold tracking-tight">Analytics need trades to chew on</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Once you've added or imported some trades, this tab fills with charts
          showing your edge by pair, time of day, mindset, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <AnalyticsBarChart
        title="By Asset Class"
        subtitle="Forex, crypto, indices, etc."
        data={byAssetClass}
      />
      <AnalyticsBarChart
        title="By Direction"
        subtitle="Long vs short performance"
        data={byDirection}
      />
      <div className="lg:col-span-2">
        <AnalyticsBarChart
          title="By Symbol"
          subtitle="Your top 12 instruments by absolute P&L"
          data={bySymbol}
          maxItems={12}
        />
      </div>
      <AnalyticsBarChart
        title="By Day of Week"
        subtitle="When you make money (or lose it)"
        data={byWeekday}
      />
      <AnalyticsBarChart
        title="By Hour of Day"
        subtitle="Session timing in your local time"
        data={byHour}
      />
      <AnalyticsBarChart
        title="By Mindset"
        subtitle="Emotional state during entry"
        data={byMindset}
        emptyMessage="Tag your trades with a mindset (focused / rushed / fomo / etc.) to see this breakdown."
      />
      <AnalyticsBarChart
        title="By Tag"
        subtitle="Your custom tags ranked by P&L"
        data={byTags}
        emptyMessage="Add tags to your trades (e.g. 'breakout', 'london', 'news') to see this breakdown."
      />
      <RMultipleChart trades={trades} />
    </div>
  );
}
