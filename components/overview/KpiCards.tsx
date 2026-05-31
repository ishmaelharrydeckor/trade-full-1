// components/overview/KpiCards.tsx
import { fmtSignedUsd, fmtPct, fmtNumber } from "@/lib/format";
import type { KpiSummary } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Target,
  Coins,
  Activity,
  Trophy,
  Flame,
} from "lucide-react";

export default function KpiCards({
  kpis,
  currency,
  currentEquity,
  startingBalance,
}: {
  kpis: KpiSummary;
  currency: string;
  currentEquity: number;
  startingBalance: number | null;
}) {
  const growth =
    startingBalance && startingBalance > 0
      ? ((currentEquity - startingBalance) / startingBalance) * 100
      : null;

  const pnlPositive = kpis.netPnl > 0;
  const pnlNegative = kpis.netPnl < 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Kpi
        icon={<Coins className="h-3.5 w-3.5" />}
        label="Net P&L"
        primary={fmtSignedUsd(kpis.netPnl)}
        primaryClass={
          pnlPositive
            ? "text-emerald-300"
            : pnlNegative
              ? "text-red-300"
              : "text-slate-300"
        }
        sub={
          growth != null
            ? `${growth >= 0 ? "+" : ""}${growth.toFixed(2)}% growth`
            : `${currency} terms`
        }
      />

      <Kpi
        icon={<Activity className="h-3.5 w-3.5" />}
        label="Trades"
        primary={String(kpis.trades)}
        sub={`${kpis.winners}W · ${kpis.losers}L${
          kpis.breakeven ? ` · ${kpis.breakeven}BE` : ""
        }`}
      />

      <Kpi
        icon={<Target className="h-3.5 w-3.5" />}
        label="Win rate"
        primary={fmtPct(kpis.winRate, 1)}
        sub={
          kpis.winRate >= 50 ? "Above 50%" : "Below 50%"
        }
        primaryClass={
          kpis.winRate >= 50 ? "text-emerald-300" : "text-slate-300"
        }
      />

      <Kpi
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Profit factor"
        primary={
          kpis.profitFactor === Infinity
            ? "∞"
            : fmtNumber(kpis.profitFactor, 2)
        }
        sub={
          kpis.profitFactor >= 2
            ? "Strong"
            : kpis.profitFactor >= 1
              ? "Profitable"
              : kpis.profitFactor > 0
                ? "Below break-even"
                : "—"
        }
        primaryClass={
          kpis.profitFactor >= 1 ? "text-emerald-300" : "text-red-300"
        }
      />

      <Kpi
        icon={<Trophy className="h-3.5 w-3.5" />}
        label="Best streak"
        primary={`${kpis.bestStreak}W`}
        sub={`Avg win: ${fmtSignedUsd(kpis.avgWinner)}`}
      />

      <Kpi
        icon={<Flame className="h-3.5 w-3.5" />}
        label="Worst streak"
        primary={`${kpis.worstStreak}L`}
        sub={`Avg loss: ${fmtSignedUsd(kpis.avgLoser)}`}
        primaryClass={kpis.worstStreak > 3 ? "text-red-300" : undefined}
      />
    </div>
  );
}

function Kpi({
  icon,
  label,
  primary,
  primaryClass,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  primaryClass?: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          primaryClass ?? "text-white"
        )}
      >
        {primary}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
