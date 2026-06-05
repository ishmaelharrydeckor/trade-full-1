// app/page.tsx
// Landing page. Editorial, restrained, signals "for serious traders."

export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Check, X, ShieldAlert, Award, Globe } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FeatureAnimation from "@/components/ui/FeatureAnimation";

export default async function LandingPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (err) {
    console.error("Supabase auth check failed on landing page:", err);
  }

  // If logged in, skip the landing page
  if (user) redirect("/dashboard");

  return (
    <main className="ambient-bg min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            T
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Trade<span style={{ color: 'var(--accent)' }}>·</span>Jernal
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-3 py-1.5 transition hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition"
            style={{
              color: 'var(--text-primary)',
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--badge-bg)',
            }}
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-12 text-center md:pt-20">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs backdrop-blur"
          style={{
            border: '1px solid var(--card-border)',
            backgroundColor: 'var(--badge-bg)',
            color: 'var(--text-secondary)',
          }}
        >
          <Sparkles className="h-3 w-3" style={{ color: 'var(--accent-blue)' }} />
          <span>The Scientific Workbench for Serious Traders</span>
        </div>

        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl" style={{ color: 'var(--text-primary)' }}>
          Trade with{" "}
          <span className="italic" style={{ color: 'var(--accent-blue)' }}>discipline</span>.
          <br />
          Review with{" "}
          <span className="italic" style={{ color: 'var(--accent-profit)' }}>honesty</span>.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          A professional, data-driven framework built to build consistency, protect capital, and isolate patterns. 
          Auto-sync from MetaTrader, measure rule compliance, and run built-in simulations.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/40 sm:w-auto"
          >
            Start journaling free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium backdrop-blur transition sm:w-auto"
            style={{
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--text-primary)',
            }}
          >
            Sign in
          </Link>
        </div>

      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard
            icon="sync"
            title="Auto-sync from MT5"
            body="Drop our lightweight EA on your chart. Every closed trade lands here in seconds — with stop loss, entry details, and execution parameters."
          />
          <FeatureCard
            icon="ai"
            title="AI insights, free"
            body="Powered by Gemini. Weekly summaries highlighting your core setup expectancy, drawdown risk factors, and behavioral patterns."
          />
          <FeatureCard
            icon="calc"
            title="Position sizing built in"
            body="Configure your risk parameters once. Our calculator tells you exactly how many lots to take on every trade setup."
          />
        </div>
      </section>


      {/* Beta Callout Section */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-2xl p-8 border bg-blue-500/[0.02] text-center relative overflow-hidden" style={{ borderColor: 'var(--accent-blue)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600" />
          <h2 className="font-serif text-3xl font-bold text-[color:var(--text-primary)]">
            Open Beta Access is Active
          </h2>
          <p className="mt-4 text-sm leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Trade·Jernal is currently in active development. During the open beta, all capabilities—including MT5 EA sync, AI-powered insights, backtesting, and journaling—are <strong>100% free with no limits</strong>.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 transition"
            >
              Secure your free beta account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
        <p>Built in Ghana 🇬🇭</p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: "sync" | "ai" | "calc";
  title: string;
  body: string;
}) {
  return (
    <div
      className="group rounded-xl p-6 pt-8 text-center backdrop-blur transition hover:shadow"
      style={{
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <FeatureAnimation type={icon} />
      <h3 className="mb-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
    </div>
  );
}
