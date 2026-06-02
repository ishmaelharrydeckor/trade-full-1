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
  Playbook,
  TradePlaybookEntry,
  JournalEntry,
  DailyHabit,
  DailyLog,
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

  // Playbooks
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("*")
    .eq("account_id", id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  // Playbook entries (all entries for trades in this account)
  const tradeIds = (trades ?? []).map((t: Trade) => t.id);
  let playbookEntries: TradePlaybookEntry[] = [];
  if (tradeIds.length > 0) {
    const { data: entries } = await supabase
      .from("trade_playbook_entries")
      .select("*")
      .in("trade_id", tradeIds.slice(0, 500));
    playbookEntries = (entries as TradePlaybookEntry[]) ?? [];
  }

  // Journal entries
  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("account_id", id)
    .order("entry_date", { ascending: false })
    .limit(90);

  // Daily habits
  const { data: habits } = await supabase
    .from("daily_habits")
    .select("*")
    .eq("account_id", id)
    .eq("archived", false)
    .order("sort_order", { ascending: true });

  // Daily logs
  const { data: dailyLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("account_id", id)
    .order("log_date", { ascending: false })
    .limit(365);

  return (
    <AccountDashboard
      account={account}
      trades={(trades as Trade[]) ?? []}
      transactions={(transactions as AccountTransaction[]) ?? []}
      settings={settings ?? null}
      playbooks={(playbooks as Playbook[]) ?? []}
      playbookEntries={playbookEntries}
      journalEntries={(journalEntries as JournalEntry[]) ?? []}
      habits={(habits as DailyHabit[]) ?? []}
      dailyLogs={(dailyLogs as DailyLog[]) ?? []}
    />
  );
}
