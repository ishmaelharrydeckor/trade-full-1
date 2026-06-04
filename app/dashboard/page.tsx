// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, Sparkles, ArrowRight } from "lucide-react";

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
    .select("id, name, broker, currency, starting_balance, created_at")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const hasAccounts = (accounts?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome hero */}
      <section className="pt-2">
        <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl" style={{ color: 'var(--text-primary)' }}>
          Welcome,{" "}
          <span
            className="font-serif italic"
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {displayName}
          </span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {hasAccounts
            ? "Pick an account to view its journal, or add another."
            : "You don't have any trading accounts yet. Let's fix that."}
        </p>
      </section>

      {/* Accounts grid */}
      {!hasAccounts ? (
        <Link
          href="/dashboard/accounts/new"
          className="group relative block overflow-hidden rounded-2xl p-10 text-center transition"
          style={{
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.05))',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              Create your first account
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
              You can have multiple trading accounts — one per broker, demo,
              prop firm challenge, or strategy.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition group-hover:shadow-blue-500/40">
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
              className="account-card group rounded-2xl p-5 transition"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{acc.name}</h3>
                <span
                  className="rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-secondary)' }}
                >
                  {acc.currency}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {acc.broker ?? "No broker set"}
              </p>
              {acc.starting_balance != null && (
                <p className="mt-3 text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  Starting:{" "}
                  <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {acc.currency} {Number(acc.starting_balance).toFixed(2)}
                  </span>
                </p>
              )}
            </Link>
          ))}
          <Link
            href="/dashboard/accounts/new"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-5 transition"
            style={{
              borderColor: 'var(--card-border)',
              color: 'var(--text-muted)',
            }}
          >
            <Plus className="mb-2 h-5 w-5" />
            <span className="text-sm">Add another account</span>
          </Link>
        </section>
      )}

      {/* Roadmap link */}
      <div className="text-center">
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
