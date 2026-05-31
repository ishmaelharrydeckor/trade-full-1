// app/dashboard/accounts/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingUp } from "lucide-react";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, broker, account_number, currency, starting_balance, ea_token, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every broker account or strategy you want to track.
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          <Plus className="h-4 w-4" /> New account
        </Link>
      </header>

      {!accounts || accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">No accounts yet.</p>
          <Link
            href="/dashboard/accounts/new"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Create your first account
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl">{acc.name}</h3>
                  <p className="text-xs text-slate-400">
                    {acc.broker ?? "No broker"} ·{" "}
                    {acc.account_number ?? "No account number"} · {acc.currency}
                  </p>
                </div>
                {acc.starting_balance != null && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Starting balance
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {acc.currency} {Number(acc.starting_balance).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                  EA Token (for MT5 webhook)
                </div>
                <code className="block break-all font-mono text-[11px] text-slate-300">
                  {acc.ea_token}
                </code>
                <p className="mt-2 text-[10px] text-slate-500">
                  The MetaTrader expert advisor will use this token to
                  attribute trades to this account. (EA download coming in
                  the next update.)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
