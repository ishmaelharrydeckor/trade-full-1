// app/page.tsx
// Landing page. Editorial, restrained, signals "for serious traders."

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Check, X, ShieldAlert, Award, Globe } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FeatureAnimation from "@/components/ui/FeatureAnimation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

        {/* Dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-blue-500/20 via-transparent to-transparent blur-xl" />
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{ border: '1px solid var(--card-border)' }}
          >
            <img
              src="/images/dashboard-preview.png"
              alt="Trade·Jernal dashboard showing KPIs, equity curve, and AI insights"
              className="w-full"
              onError={(e) => {
                // Prevent broken image icon if preview not built yet
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
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

      {/* Competitive Table Section */}
      <section className="mx-auto max-w-5xl px-6 pb-20 space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Why Trade·Jernal?
          </h2>
          <p className="mx-auto mt-2 text-sm text-[color:var(--text-secondary)]">
            How we compare against general market tools like TradeZella
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-white/[0.01] backdrop-blur" style={{ borderColor: 'var(--card-border)' }}>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]" style={{ borderColor: 'var(--card-border)' }}>
                <th className="px-6 py-4">Capability</th>
                <th className="px-6 py-4 text-center text-blue-400">Trade·Jernal</th>
                <th className="px-6 py-4 text-center">TradeZella</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">Price (Per Month)</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">$5.99 – $14.99</td>
                <td className="px-6 py-4 text-center text-red-400 font-bold">$30.00 – $50.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">Free Tier Account</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Yes (Manual & CSV)</td>
                <td className="px-6 py-4 text-center text-red-400 font-bold">No</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">Local EA Auto-Sync</td>
                <td className="px-6 py-4 text-center"><Check className="inline h-5 w-5 text-emerald-400" /></td>
                <td className="px-6 py-4 text-center"><X className="inline h-5 w-5 text-red-400" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">AI Weekly Insights</td>
                <td className="px-6 py-4 text-center"><Check className="inline h-5 w-5 text-emerald-400" /></td>
                <td className="px-6 py-4 text-center"><X className="inline h-5 w-5 text-red-400" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">Co-Branded Mentor Boards</td>
                <td className="px-6 py-4 text-center"><Check className="inline h-5 w-5 text-emerald-400" /></td>
                <td className="px-6 py-4 text-center"><X className="inline h-5 w-5 text-red-400" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-200">Built-in Backtest Simulator</td>
                <td className="px-6 py-4 text-center"><Check className="inline h-5 w-5 text-emerald-400" /></td>
                <td className="px-6 py-4 text-center"><X className="inline h-5 w-5 text-red-400" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Transparent, Localized Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[color:var(--text-secondary)]">
            Designed to support emerging market retail traders. We accept Mobile Money (MTN, Telecel, Orange, M-Pesa).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Plan 1: Free */}
          <div className="rounded-2xl p-6 flex flex-col justify-between border bg-white/[0.01]" style={{ borderColor: 'var(--card-border)' }}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Novice</span>
              <h3 className="text-2xl font-bold mt-1 text-[color:var(--text-primary)]">Free</h3>
              <div className="text-3xl font-extrabold tracking-tighter mt-4 text-[color:var(--text-primary)]">$0</div>
              <p className="text-[10px] text-slate-500 mt-1">Free forever</p>
              
              <ul className="mt-6 space-y-2.5 text-xs text-[color:var(--text-secondary)]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 1 Trading Account</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Manual Trade Logging</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Unlimited CSV Imports</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 3 Playbook Rules Max</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block w-full text-center rounded-lg border py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
              style={{ borderColor: 'var(--card-border)' }}
            >
              Get Started
            </Link>
          </div>

          {/* Plan 2: Standard (Pro) */}
          <div className="rounded-2xl p-6 flex flex-col justify-between border bg-blue-500/[0.02] relative" style={{ borderColor: 'var(--accent-blue)' }}>
            <div className="absolute top-4 right-4 rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-wider">
              Popular
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Standard Pro</span>
              <h3 className="text-2xl font-bold mt-1 text-[color:var(--text-primary)]">Standard</h3>
              <div className="text-3xl font-extrabold tracking-tighter mt-4 text-[color:var(--text-primary)]">$5.99 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
              <p className="text-[10px] text-slate-500 mt-1">GHS 90 · NGN 9,000 · KES 850</p>
              
              <ul className="mt-6 space-y-2.5 text-xs text-[color:var(--text-secondary)]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> **MT5 EA Local Sync**</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 3 Active Accounts</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Unlimited Playbook Rules</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Mentor Dashboard Sharing</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Habits & Discipline Heatmap</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block w-full text-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 transition"
            >
              Start Trial
            </Link>
          </div>

          {/* Plan 3: Elite */}
          <div className="rounded-2xl p-6 flex flex-col justify-between border bg-white/[0.01]" style={{ borderColor: 'var(--card-border)' }}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Automated</span>
              <h3 className="text-2xl font-bold mt-1 text-[color:var(--text-primary)]">Elite</h3>
              <div className="text-3xl font-extrabold tracking-tighter mt-4 text-[color:var(--text-primary)]">$14.99 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
              <p className="text-[10px] text-slate-500 mt-1">GHS 230 · NGN 23,000 · KES 2,100</p>
              
              <ul className="mt-6 space-y-2.5 text-xs text-[color:var(--text-secondary)]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> **24/7 Cloud Auto-Sync**</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Unlimited Accounts</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Drawdown Locks (Shield)</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Gemini AI Weekly Insights</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Prop Firm Rule Validator</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block w-full text-center rounded-lg border py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
              style={{ borderColor: 'var(--card-border)' }}
            >
              Go Elite
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
