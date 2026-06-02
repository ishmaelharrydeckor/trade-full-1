// app/dashboard/accounts/[id]/page.tsx
// Per-account dashboard. Server-fetches everything once, then hands off
// to the client AccountDashboard which manages tab state.

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AccountDashboard from "@/components/dashboard/AccountDashboard";
import type {
  Account,
  Trade,
  AccountTransaction,
  AccountSettings,
} from "@/types/database";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Account (RLS filters to current user — if no row, the user doesn't own it)
  const { data: account } = await supabase
    .from("accounts")
    .select(
      "id, user_id, name, broker, account_number, currency, starting_balance, ea_token, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle<Account>();

  if (!account) {
    notFound();
  }

  // Trades for this account, newest first — exclude backtest trades by default
  // (per the user decision in M4 planning). Backtest trades are visible inside
  // their own session page.
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("account_id", id)
    .eq("is_backtest", false)
    .order("close_time", { ascending: false, nullsFirst: false });

  // Transactions
  const { data: transactions } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("account_id", id)
    .order("occurred_at", { ascending: false });

  // Settings — may not exist yet (we create on first use)
  const { data: settings } = await supabase
    .from("account_settings")
    .select("*")
    .eq("account_id", id)
    .maybeSingle<AccountSettings>();

  return (
    <AccountDashboard
      account={account}
      trades={(trades as Trade[]) ?? []}
      transactions={(transactions as AccountTransaction[]) ?? []}
      settings={settings ?? null}
    />
  );
}
