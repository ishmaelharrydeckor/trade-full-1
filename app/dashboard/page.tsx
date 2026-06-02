// app/dashboard/page.tsx
// Main dashboard entry. Lists accounts (or shows a prominent CTA to create the first one).

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Plus,
  TrendingUp,
  Sparkles,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    .eq("archived", false)
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
            : "You don't have any trading accounts yet. Let's fix that."}
        </p>
      </section>

      {/* Accounts list OR a very visible empty state */}
      {!hasAccounts ? (
        <Link
          href="/dashboard/accounts/new"
          className="group relative block overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-blue-500/[0.05] to-transparent p-10 text-center transition hover:border-blue-400/50 hover:from-blue-500/20"
        >
          {/* Glow accent */}
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/30 shadow-lg shadow-blue-500/20">
              <Plus className="h-7 w-7 text-blue-100" />
            </div>
            <h2 className="font-serif text-3xl tracking-tight">
              Create your first account
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
              You can have multiple trading accounts — one per broker, demo,
              prop firm challenge, or strategy. Each tracks its own trades,
              equity curve, and metrics.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition group-hover:bg-blue-400">
              Get started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts!.map((acc) => (
            <Link
              key={acc.id}
              href={`/dashboard/accounts/${acc.id}`}
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

      {/* Build roadmap — accurate to the current state */}
      <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h3 className="font-serif text-lg">Build status</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <RoadmapItem
            done
            label="Live now"
            items={[
              "Multi-tenant auth",
              "Per-account dashboard",
              "Manual trade entry",
              "KPIs + equity curve",
              "Drawdown account view",
              "EA token per account",
            ]}
          />
          <RoadmapItem
            label="Coming next (M2.2 + M3)"
            items={[
              "Analytics tab (12 charts)",
              "Calendar heatmap",
              "MT5 auto-sync EA",
              "CSV import",
            ]}
          />
          <RoadmapItem
            label="After that"
            items={[
              "AI insights (Gemini)",
              "Position calculator",
              "Risk compliance",
              "Manual backtester",
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function RoadmapItem({
  done,
  label,
  items,
}: {
  done?: boolean;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
        {done ? (
          <>
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">{label}</span>
          </>
        ) : (
          <>
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400">{label}</span>
          </>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it}
            className={
              done ? "text-slate-300" : "text-slate-500"
            }
          >
            · {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
