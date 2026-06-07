// app/page.tsx
// Landing page. Redesigned to focus on execution intelligence & psychology.
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  ArrowRight, 
  Sparkles, 
  Check, 
  ShieldAlert, 
  Activity, 
  Flame, 
  Ban, 
  AlertTriangle, 
  RefreshCw, 
  BookText, 
  Calendar, 
  Target, 
  Shield, 
  Zap, 
  Lock, 
  UserCheck 
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
    <main className="ambient-bg min-h-screen font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--nav-bg)' }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-12">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="TradeJernal Logo"
              width={32}
              height={32}
              priority
              className="object-contain"
            />
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Trade<span className="text-emerald-500">·</span>Journal
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <a
              href="#problem"
              className="hidden px-2 py-1.5 transition hover:opacity-80 sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              The Problem
            </a>
            <a
              href="#solutions"
              className="hidden px-2 py-1.5 transition hover:opacity-80 sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Solutions
            </a>
            <Link
              href="/login"
              className="px-2 py-1.5 transition hover:opacity-80 text-xs sm:text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 text-xs sm:text-sm"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              }}
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-28 md:pb-32">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
          style={{
            backgroundImage: `radial-gradient(var(--text-muted) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="mx-auto max-w-5xl text-center">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur"
            style={{
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--text-secondary)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Execution Intelligence System</span>
          </div>

          <h1 className="font-serif text-5xl font-normal leading-[1.1] tracking-tight sm:text-6xl md:text-8xl" style={{ color: 'var(--text-primary)' }}>
            &ldquo;Your <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent font-semibold">Strategy</span> Isn&apos;t The <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent font-semibold">Problem</span>.&rdquo;
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg font-medium leading-relaxed md:text-xl" style={{ color: 'var(--text-primary)' }}>
            Most traders don&apos;t fail because they lack strategy. They fail because they can&apos;t consistently execute the strategy they already have.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Trade·Journal is an Execution Intelligence System that helps you understand your behavior, find your patterns, and build the consistency you&apos;ve been missing.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              }}
            >
              Start Your Beta Access <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="#problem"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-7 py-3.5 font-semibold transition hover:bg-white/5 sm:w-auto"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--text-primary)',
              }}
            >
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Built by traders. Backed by data. Designed for self-awareness.
          </p>

          {/* Side-by-side Dashboard & Calendar Screenshot View Mockup */}
          <div className="relative mt-16 md:mt-24">
            <div className="group relative mx-auto max-w-5xl rounded-2xl border p-2 backdrop-blur-md transition-all duration-300 md:p-3"
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "rgba(255, 255, 255, 0.01)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(79, 130, 246, 0.05)",
              }}
            >
              {/* Browser bar */}
              <div className="flex items-center justify-between border-b pb-2.5 px-3 mb-2 md:mb-3"
                style={{ borderColor: "var(--card-border)" }}
              >
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="rounded bg-black/40 px-6 py-0.5 text-[10px] tracking-wide text-slate-500 font-mono">
                  app.trade-journal.io/dashboard
                </div>
                <div className="w-10" />
              </div>

              {/* Side by side visual layout */}
              <div className="grid grid-cols-1 overflow-hidden rounded-lg bg-black/40 lg:grid-cols-2">
                <div className="relative aspect-[16/11] border-r border-white/5">
                  <Image
                    src="/images/dashboard-sync.png"
                    alt="Trade Journal Sync Dashboard Overview"
                    fill
                    unoptimized
                    priority
                    className="object-cover object-top"
                  />
                </div>
                <div className="relative aspect-[16/11]">
                  <Image
                    src="/images/dashboard-calendar.png"
                    alt="Trade Journal Calendar View"
                    fill
                    unoptimized
                    priority
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION (Pain Agitation) */}
      <section id="problem" className="relative border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              The real problem isn&apos;t your strategy. <br className="hidden sm:inline" />
              It&apos;s your <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent">execution</span>.
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              Traders struggle with the same invisible problems every day.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldAlert,
                color: "text-red-400",
                title: "Break rules after losses",
                desc: "Revenge trading to make back lost capital immediately, disregarding setup guidelines."
              },
              {
                icon: Activity,
                color: "text-amber-400",
                title: "Move stops emotionally",
                desc: "Widening your stop loss in the heat of the moment, hoping the market turns around."
              },
              {
                icon: Flame,
                color: "text-orange-400",
                title: "Overtrade after wins",
                desc: "Becoming overconfident after a successful trade and entering subpar market setups."
              },
              {
                icon: Ban,
                color: "text-rose-400",
                title: "Ignore their plan",
                desc: "Failing to document setups, ignoring predetermined risk controls, and trading on impulse."
              },
              {
                icon: RefreshCw,
                color: "text-blue-400",
                title: "Can't stay consistent",
                desc: "Jumping from strategy to strategy, never executing one long enough to let edge play out."
              },
              {
                icon: AlertTriangle,
                color: "text-yellow-400",
                title: "Repeat the same mistakes",
                desc: "Recognizing mistakes only in hindsight, without keeping track of why they happen."
              }
            ].map((pain, idx) => {
              const Icon = pain.icon;
              return (
                <div 
                  key={idx} 
                  className="group rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 ${pain.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{pain.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pain.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. THE INSIGHT SHIFT SECTION */}
      <section className="border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)' }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              Strategy gets you in the game. <br className="hidden sm:inline" />
              <span className="italic text-emerald-400">Execution</span> keeps you in the game.
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Most traders already know what to do. Very few understand why they don&apos;t do it.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 rounded-3xl border p-8 md:grid-cols-2 md:p-12"
            style={{
              borderColor: 'var(--card-border)',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            {/* Before column */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/10">
                Before Execution Intelligence
              </span>
              <ul className="space-y-4">
                {[
                  "Blame the strategy when losing trades occur",
                  "React emotionally to short-term market movements",
                  "Repeat the same psychological mistakes weekly",
                  "No clear consistency or tracking of discipline rules"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">✖</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After column */}
            <div className="space-y-6 border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8" style={{ borderColor: 'var(--card-border)' }}>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/10">
                After: With Trade·Journal
              </span>
              <ul className="space-y-4">
                {[
                  "Understand behavior and biological triggers behind results",
                  "Follow the plan rigorously regardless of short-term noise",
                  "Break the cycle of impulsive decision-making",
                  "Build consistency through daily metrics and accountability stats"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE SOLUTION SECTION */}
      <section id="solutions" className="border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              Trade·Journal is your <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-500 to-emerald-400 bg-clip-text text-transparent">Execution Intelligence System</span>
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Built to help you understand your trading behavior, identify patterns, and build consistency.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {[
              {
                icon: Activity,
                title: "Understand Behavior",
                desc: "Identify the habits, triggers, and psychological patterns behind your results. Know which mood states correlate with win rates."
              },
              {
                icon: BookText,
                title: "Review Smarter",
                desc: "Deep, structured reviews that turn raw transaction data into self-awareness. Pre-session plans set execution expectations."
              },
              {
                icon: Target,
                title: "Build Consistency",
                desc: "Track progress. Reinforce execution guidelines. Strengthen your mental stamina and build long-term trading discipline."
              },
              {
                icon: Sparkles,
                title: "Improve Over Time",
                desc: "Isolate small behavioral errors. Make compounding adjustments that transform inconsistent accounts into professional logs."
              }
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={i} 
                  className="group relative rounded-2xl border p-8 transition-all hover:border-indigo-500/30"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-indigo-500/15 text-indigo-400 group-hover:text-emerald-400 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{pillar.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT PREVIEW SECTION */}
      <section className="border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)' }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              Tools built specifically for <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">execution</span>.
            </h2>
            <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              A visual overview of the tools engineered to monitor rules compliance, tag playbooks, and isolate patterns.
            </p>
          </div>
          <ProductGallery />
        </div>
      </section>

      {/* 6. SOCIAL PROOF SECTION */}
      <section className="border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Early traders are already seeing the difference.
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Real insights. Real behavior changes. Real results.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              "&ldquo;I didn&apos;t realize I kept breaking rules after losses. This completely changed my reviews.&rdquo;",
              "&ldquo;I thought strategy was my problem. Turns out, I just wasn&apos;t executing what I already knew.&rdquo;",
              "&ldquo;The insights helped me see patterns I never tracked before. Total game changer.&rdquo;"
            ].map((quote, i) => (
              <div 
                key={i} 
                className="relative rounded-2xl border p-6 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: quote }} />
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    TR
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Beta Trader</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t pt-10 sm:grid-cols-4" style={{ borderColor: 'var(--card-border)' }}>
            {[
              { icon: UserCheck, text: "Built by Traders For Traders" },
              { icon: Shield, text: "Evidence-Based Not Guesswork" },
              { icon: Lock, text: "Privacy First Your Data Stays Yours" },
              { icon: Zap, text: "Beta Program Limited Early Access" }
            ].map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center p-3">
                  <Icon className="h-5 w-5 mb-2 text-emerald-400" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="relative overflow-hidden border-t py-24 md:py-32" style={{ borderColor: 'var(--border-panel)' }}>
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Ready to take control of your execution?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
            Join our beta program and start building consistency today.
          </p>

          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              }}
            >
              Start Your Beta Access <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> Free during beta</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> Built for serious traders</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
        <p>&copy; Trade-Journal. All rights reserved. Built in Ghana 🇬🇭</p>
      </footer>
    </main>
  );
}
