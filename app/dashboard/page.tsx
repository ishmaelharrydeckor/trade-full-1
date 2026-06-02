// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Plus,
  TrendingUp,
  Sparkles,
  Check,
  Clock,
  ArrowRight,
  BookOpen,
  Target,
  Brain,
  Shield,
  Users,
  BarChart3,
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
    <div className="flex flex-col gap-10">
      {/* Welcome hero */}
      <section className="pt-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: 'var(--text-primary)' }}>
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
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Create your first account
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
              You can have multiple trading accounts — one per broker, demo,
              prop firm challenge, or strategy.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition group-hover:shadow-blue-500/40">
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
              className="group rounded-2xl p-5 transition"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--card-hover-border)';
                e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--card-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{acc.name}</h3>
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
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
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

      {/* Build roadmap */}
      <section
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--card-border)',
        }}
      >
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: 'var(--accent-blue)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Build status</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
          <RoadmapItem
            done
            label="Live now"
            items={[
              "Multi-tenant auth",
              "Per-account dashboard",
              "Manual trade entry + CSV import",
              "KPIs + equity curve + drawdown",
              "Analytics (12 charts)",
              "Calendar heatmap",
              "Playbook system",
              "Notebook / session planner",
              "Progress tracker",
              "AI insights (Gemini)",
              "Mentor mode",
              "MT5 EA auto-sync",
            ]}
          />
          <RoadmapItem
            label="Coming next"
            items={[
              "Broker API sync (direct)",
              "Mobile PWA app",
              "Trade replay",
              "Dashboard customizer",
            ]}
          />
          <RoadmapItem
            label="After that"
            items={[
              "Community features",
              "Shareable trade cards",
              "Prop firm integrations",
              "White-label / teams",
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
            <Check className="h-3 w-3" style={{ color: 'var(--accent-profit)' }} />
            <span style={{ color: 'var(--accent-profit)' }}>{label}</span>
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it}
            style={{ color: done ? 'var(--text-secondary)' : 'var(--text-muted)' }}
          >
            · {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
