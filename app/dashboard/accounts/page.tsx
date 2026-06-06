// app/dashboard/accounts/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft } from "lucide-react";
import ManageAccountsClient, { ComputedAccount } from "@/components/account/ManageAccountsClient";

export default async function AccountsPage() {
  const supabase = await createClient();
  
  // Get user to restrict check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all accounts (active and archived)
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch trades to compute Win Rates and Net P&L
  const { data: trades } = await supabase
    .from("trades")
    .select("account_id, pnl, commission, swap, close_time, open_time")
    .eq("is_backtest", false);

  // Fetch account transactions to compute current exact balances
  const { data: transactions } = await supabase
    .from("account_transactions")
    .select("account_id, type, amount");

  // Map and calculate statistics for each account
  const computedAccounts: ComputedAccount[] = (accounts ?? []).map((acc) => {
    const accTrades = (trades ?? []).filter((t) => t.account_id === acc.id);
    const accTransactions = (transactions ?? []).filter((t) => t.account_id === acc.id);

    // Calculate P&L sum
    const netPnL = accTrades.reduce((sum, t) => {
      const gross = t.pnl ?? 0;
      const net = gross - (t.commission ?? 0) - (t.swap ?? 0);
      return sum + net;
    }, 0);

    // Calculate Deposits & Withdrawals sum
    const depositSum = accTransactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawalSum = accTransactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = (acc.starting_balance ?? 0) + netPnL + depositSum - withdrawalSum;

    // Win Rate calculation
    const closedTrades = accTrades.filter((t) => t.close_time !== null);
    const winningTrades = closedTrades.filter((t) => {
      const gross = t.pnl ?? 0;
      const net = gross - (t.commission ?? 0) - (t.swap ?? 0);
      return net > 0;
    });
    const winRate = closedTrades.length > 0
      ? Math.round((winningTrades.length / closedTrades.length) * 100)
      : 0;

    return {
      id: acc.id,
      name: acc.name,
      broker: acc.broker,
      account_number: acc.account_number,
      currency: acc.currency,
      starting_balance: acc.starting_balance ?? 0,
      created_at: acc.created_at,
      archived: acc.archived ?? false,
      current_balance: currentBalance,
      net_pnl: netPnL,
      win_rate: winRate,
      total_trades: closedTrades.length,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white self-start transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <ManageAccountsClient initialAccounts={computedAccounts} />
    </div>
  );
}

