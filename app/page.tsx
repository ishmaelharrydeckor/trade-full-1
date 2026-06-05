// app/page.tsx
// Landing page. Editorial, restrained, signals "for serious traders."

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Check, X, ShieldAlert, Award, Globe } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FeatureAnimation from "@/components/ui/FeatureAnimation";
import ProductGallery from "@/components/ui/ProductGallery";

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
            Trade<span style={{ color: 'var(--accent)' }}>·</span>Journal
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <a
            href="#features"
            className="px-3 py-1.5 transition hover:opacity-80 font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Features
          </a>
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

      {/* Product Gallery Section */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-[color:var(--text-primary)]">
            Explore the Scientific Workbench
          </h2>
          <p className="mt-2 text-sm max-w-lg mx-auto text-[color:var(--text-secondary)]">
            A visual overview of the systems designed to monitor performance, manage rules, and enforce trading guidelines.
          </p>
        </div>
        <ProductGallery />
      </section>

      {/* Alternating Feature Showcase Section */}
      <section id="features" className="scroll-mt-16 mx-auto max-w-5xl px-6 pb-24 space-y-24">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight text-[color:var(--text-primary)]">
            Professional Systems Built to Scale
          </h2>
          <p className="mt-4 text-base max-w-xl mx-auto text-[color:var(--text-secondary)]">
            Trade Journal provides the analytical tooling and behavioral controls of institutional trading desks.
          </p>
        </div>

        {/* Feature 1: MT5 Sync */}
        <div className="flex flex-col gap-12 md:flex-row md:items-center">
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/5 border border-blue-500/10">
              Auto-Sync
            </span>
            <h3 className="font-serif text-3xl font-bold text-[color:var(--text-primary)]">
              Hands-Off MetaTrader 5 Synchronization
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Stop manually logging stats. Drag our customized Expert Advisor onto any MT5 chart window. The second you close a position, the entry, exit, commissions, swaps, volume, and tick history sync straight to your web dashboard.
            </p>
            <ul className="space-y-2.5 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Zero CSV files or manual typing required</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Synchronizes stops, limits, swaps, and execution speeds</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Automatic lot sizing based on defined risk percentage parameters</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border p-1 backdrop-blur bg-white/5" style={{ borderColor: 'var(--card-border)' }}>
              <Image
                src="/images/dashboard-sync.png"
                alt="MT5 Live Sync Instructions & Risk Strategy"
                fill
                unoptimized
                className="object-contain object-top rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Calendar */}
        <div className="flex flex-col gap-12 md:flex-row-reverse md:items-center">
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 border border-emerald-500/10">
              Interactive Indexing
            </span>
            <h3 className="font-serif text-3xl font-bold text-[color:var(--text-primary)]">
              Visual Trading Calendar & Command Center
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Locate high-performance cycles instantly. Our interactive calendar charts net outcomes day-by-day, color-coding win/loss distributions, active win streaks, and net profit margins. It provides a visual timeline of your progress.
            </p>
            <ul className="space-y-2.5 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>High-contrast color representation of winning and losing days</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Track active streaks and weekly average performance values</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Instant click-to-view daily journal details directly from calendar boxes</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border p-1 backdrop-blur bg-white/5" style={{ borderColor: 'var(--card-border)' }}>
              <Image
                src="/images/dashboard-calendar.png"
                alt="Performance Trading Calendar"
                fill
                unoptimized
                className="object-contain object-top rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Discipline */}
        <div className="flex flex-col gap-12 md:flex-row md:items-center">
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/5 border border-amber-500/10">
              Behavioral Control
            </span>
            <h3 className="font-serif text-3xl font-bold text-[color:var(--text-primary)]">
              Daily Rule Enforcement & Heatmaps
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Profitable trading is an exercise in restraint. Define custom checklists, monitor daily execution streaks, and record your rule-compliance score. Watch your discipline heatmap grow greener over time as you train yourself to avoid FOMO and follow your rules.
            </p>
            <ul className="space-y-2.5 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Add custom trading habits (e.g., "Wait for 15M candle close")</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Visual multiday streaks and habit scoring analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Long-term discipline heatmaps tracking consistent check-ins</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border p-1 backdrop-blur bg-white/5" style={{ borderColor: 'var(--card-border)' }}>
              <Image
                src="/images/dashboard-progress.png"
                alt="Today's Discipline and Habit Heatmap"
                fill
                unoptimized
                className="object-contain object-top rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Feature 4: Notebook */}
        <div className="flex flex-col gap-12 md:flex-row-reverse md:items-center">
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/5 border border-indigo-500/10">
              Psychology Notebook
            </span>
            <h3 className="font-serif text-3xl font-bold text-[color:var(--text-primary)]">
              Structured Pre-Session & Post-Session Journaling
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Trade with a structured mindset. Document your directional bias before logging a single setup. Log current market conditions and select your mental states (e.g. calm, anxious, excited). Conclude your trading days with reviews and key takeaways.
            </p>
            <ul className="space-y-2.5 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Write detailed pre-session game plans before markets open</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Isolate trades taken under stress or during ranging conditions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Build a historical archive of lessons learned to review weekly</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border p-1 backdrop-blur bg-white/5" style={{ borderColor: 'var(--card-border)' }}>
              <Image
                src="/images/dashboard-journal.png"
                alt="Today's Journal Entry details"
                fill
                unoptimized
                className="object-contain object-top rounded-lg"
              />
            </div>
          </div>
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
            Trade·Journal is currently in active development. During the open beta, all capabilities—including MT5 EA sync, AI-powered insights, backtesting, and journaling—are <strong>100% free with no limits</strong>.
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
