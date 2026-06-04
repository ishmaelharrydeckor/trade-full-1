// app/dashboard/accounts/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, broker, account_number, currency, starting_balance, ea_token, created_at")
    .order("created_at", { ascending: false });

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
            <Link
              key={acc.id}
              href={`/dashboard/accounts/${acc.id}`}
              className="group block rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl">{acc.name}</h3>
                    <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:text-white group-hover:translate-x-0.5" />
                  </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
