// app/dashboard/accounts/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, ChevronLeft } from "lucide-react";
import AccountsManagement from "@/components/dashboard/AccountsManagement";

export default async function AccountsPage() {
  const supabase = await createClient();

  // Load all accounts (active + archived) for the management dashboard
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, broker, account_number, currency, starting_balance, ea_token, archived, created_at")
    .order("created_at", { ascending: false });

  // Load trades to evaluate performance snapshots
  const { data: trades } = await supabase
    .from("trades")
    .select("account_id, pnl, close_time")
    .eq("is_backtest", false);

  // Load transactions to calculate exact balances
  const { data: transactions } = await supabase
    .from("account_transactions")
    .select("account_id, type, amount");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-white">Accounts Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Manage your strategies, brokers, funded challenges, and active trading capital structures.
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100 shadow"
        >
          <Plus className="h-4 w-4" /> Initialize Account
        </Link>
      </header>

      {!accounts || accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-slate-400">No accounts configured yet.</p>
          <Link
            href="/dashboard/accounts/new"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Initialize your first account
          </Link>
        </div>
      ) : (
        <AccountsManagement
          initialAccounts={accounts}
          trades={trades ?? []}
          transactions={transactions ?? []}
        />
      )}
    </div>
  );
}
