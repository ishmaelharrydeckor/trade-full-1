// app/page.tsx
// Landing page. Editorial, restrained, signals "for serious traders."

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

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
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            T
          </div>
          <span className="font-serif text-xl italic tracking-tight">
            Trade<span className="text-blue-400">·</span>Journal
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="px-3 py-1.5 text-slate-300 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white backdrop-blur transition hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center md:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 backdrop-blur">
          <Sparkles className="h-3 w-3 text-blue-400" />
          <span>Now with AI-powered insights</span>
        </div>

        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Trade with{" "}
          <span className="italic text-blue-300">discipline</span>.
          <br />
          Review with{" "}
          <span className="italic text-emerald-300">honesty</span>.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400">
          A trading journal built for traders who want to know — not guess —
          whether their edge is real. Auto-synced from MetaTrader. Tagged,
          measured, replayed.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-slate-900 transition hover:bg-slate-100 sm:w-auto"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/10 sm:w-auto"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Free for the first 6 months. No credit card required.
        </p>
      </section>

      {/* Feature row */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Feature
            title="Auto-sync from MT5"
            body="Drop the expert advisor on your chart. Every closed trade lands here in seconds — with stop loss, R-multiple, and dollar risk."
          />
          <Feature
            title="AI insights, free"
            body="Powered by Gemini. Weekly observations about your edge, your blind spots, your discipline patterns."
          />
          <Feature
            title="Position sizing built in"
            body="Configure your risk strategy once. Calculator tells you exactly how many lots to take on every setup."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-500">
        <p>
          Built in Ghana ·{" "}
          <span className="font-mono">v0.1 · trade-full-1</span>
        </p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur transition hover:border-white/10">
      <h3 className="mb-2 font-serif text-xl">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
