// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import OnboardingHub, { AccountData } from "@/components/dashboard/OnboardingHub";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "trader";

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  // Query trades to calculate win rates & relative P&L snapshots
  const { data: trades } = await supabase
    .from("trades")
    .select("account_id, pnl, close_time, open_time")
    .eq("is_backtest", false);

  // Query transactions to compute current exact balance
  const { data: transactions } = await supabase
    .from("account_transactions")
    .select("account_id, type, amount");

  // Compute stats for each account
  const computedAccounts: AccountData[] = (accounts ?? []).map((acc) => {
    const accTrades = (trades ?? []).filter((t) => t.account_id === acc.id);
    const accTransactions = (transactions ?? []).filter((t) => t.account_id === acc.id);

    // Calculate P&L sum
    const netPnL = accTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

    // Calculate Deposits and Withdrawals sum
    const depositSum = accTransactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawalSum = accTransactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = (acc.starting_balance ?? 0) + netPnL + depositSum - withdrawalSum;

    // Win rate percentage
    const closedTrades = accTrades.filter((t) => t.close_time !== null);
    const winningTrades = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
    const winRate = closedTrades.length > 0 
      ? Math.round((winningTrades.length / closedTrades.length) * 100)
      : 0;

    // Last activity detection
    let lastActivity: string | null = null;
    const timestamps = accTrades
      .map((t) => t.close_time || t.open_time)
      .filter(Boolean) as string[];
    if (timestamps.length > 0) {
      const latestTime = Math.max(...timestamps.map((t) => new Date(t).getTime()));
      lastActivity = new Date(latestTime).toISOString();
    }

    return {
      id: acc.id,
      name: acc.name,
      broker: acc.broker,
      currency: acc.currency,
      starting_balance: acc.starting_balance,
      created_at: acc.created_at,
      current_balance: currentBalance,
      total_trades: closedTrades.length,
      win_rate: winRate,
      net_pnl: netPnL,
      last_activity: lastActivity,
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <OnboardingHub displayName={displayName} accounts={computedAccounts} />

      {/* Roadmap link */}
      <div className="text-center pt-4">
        <Link
          href="/dashboard/changelog"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <Sparkles className="h-3 w-3" /> View build roadmap
        </Link>
      </div>
    </div>
  );
}
