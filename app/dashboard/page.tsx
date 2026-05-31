// app/dashboard/page.tsx
// Main dashboard entry. For now it shows a welcome state and prompts
// the user to create their first trading account.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingUp, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile (already created by the trigger when they signed up)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ?? user?.email?.split("@")[0] ?? "trader";

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, broker, currency, starting_balance, created_at")
    .order("created_at", { ascending: false });

  const hasAccounts = (accounts?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <section>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
          Welcome,{" "}
          <span className="italic text-blue-300">{displayName}</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {hasAccounts
            ? "Pick an account to view its journal, or add another."
            : "Let's get your first trading account set up."}
        </p>
      </section>

      {/* Accounts list or empty state */}
      {!hasAccounts ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
            <TrendingUp className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="font-serif text-2xl">Your first account</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Add a trading account to start tracking. You can have multiple —
            one per broker, demo, prop firm, or strategy.
          </p>
          <Link
            href="/dashboard/accounts/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" />
            Create account
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts!.map((acc) => (
            <Link
              key={acc.id}
              href={`/dashboard/accounts`}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.05]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-serif text-xl">{acc.name}</h3>
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {acc.currency}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {acc.broker ?? "No broker set"}
              </p>
              {acc.starting_balance != null && (
                <p className="mt-3 text-sm tabular-nums text-slate-300">
                  Starting:{" "}
                  <span className="text-white">
                    {acc.currency} {Number(acc.starting_balance).toFixed(2)}
                  </span>
                </p>
              )}
            </Link>
          ))}
          <Link
            href="/dashboard/accounts/new"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-transparent p-5 text-slate-400 transition hover:border-blue-500/30 hover:bg-white/[0.02] hover:text-white"
          >
            <Plus className="mb-2 h-5 w-5" />
            <span className="text-sm">Add another account</span>
          </Link>
        </section>
      )}

      {/* What's coming soon */}
      <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h3 className="font-serif text-lg">Coming soon</h3>
        </div>
        <p className="text-sm text-slate-400">
          The full dashboard — analytics, calendar, drawdown tracking, AI
          insights, position sizing calculator, and the auto-syncing MT5
          expert advisor — lands in the next update. We&apos;re building this
          one phase at a time to keep it stable.
        </p>
      </section>
    </div>
  );
}
