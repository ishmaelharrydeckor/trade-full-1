// components/dashboard/OnboardingHub.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Star, ArrowRight, TrendingUp, TrendingDown, Clock, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccountData {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
  starting_balance: number | null;
  created_at: string;
  current_balance: number;
  total_trades: number;
  win_rate: number;
  net_pnl: number;
  last_activity: string | null;
}

interface OnboardingHubProps {
  displayName: string;
  accounts: AccountData[];
}

export default function OnboardingHub({ displayName, accounts }: OnboardingHubProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  // Load pinned account from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tj-pinned-account");
    if (saved) {
      setPinnedId(saved);
    }
  }, []);

  function togglePin(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    if (next) {
      localStorage.setItem("tj-pinned-account", next);
    } else {
      localStorage.removeItem("tj-pinned-account");
    }
  }

  // Sort accounts: pinned first, then by created_at desc
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.id === pinnedId) return -1;
    if (b.id === pinnedId) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Relative time helper
  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return "No activity yet";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // Deduce account type label
  function getAccountType(name: string, broker: string | null) {
    const bLower = (broker ?? "").toLowerCase();
    const nLower = name.toLowerCase();

    const propFirms = ["ftmo", "fundednext", "apex", "pips", "e8", "topstep", "bespoke"];
    const isProp = propFirms.some((pf) => bLower.includes(pf) || nLower.includes(pf));

    if (isProp) return "Funded Account";
    if (nLower.includes("demo") || bLower.includes("demo")) return "Demo Account";
    return "Live Brokerage";
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>
            Welcome back,{" "}
            <span
              className="font-serif italic pr-1"
              style={{
                background: "linear-gradient(135deg, #4F46E5, #10B981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {displayName}
            </span>
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            Choose an execution account to view metrics, log setups, or review performance.
          </p>
        </div>
      </section>

      {/* Grid wrapper */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedAccounts.map((acc) => {
          const isPinned = acc.id === pinnedId;
          const accountType = getAccountType(acc.name, acc.broker);
          
          return (
            <Link
              key={acc.id}
              href={`/dashboard/accounts/${acc.id}`}
              className="group relative flex h-[220px] flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: isPinned ? "rgba(79, 70, 229, 0.4)" : "var(--card-border)",
                boxShadow: isPinned ? "0 0 20px rgba(79, 70, 229, 0.05)" : "none",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = isPinned ? "rgba(79, 70, 229, 0.6)" : "var(--card-hover-border)";
                e.currentTarget.style.boxShadow = isPinned 
                  ? "0 0 25px rgba(79, 70, 229, 0.12), var(--card-hover-shadow)" 
                  : "var(--card-hover-shadow)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = isPinned ? "rgba(79, 70, 229, 0.4)" : "var(--card-border)";
                e.currentTarget.style.boxShadow = isPinned ? "0 0 20px rgba(79, 70, 229, 0.05)" : "none";
              }}
            >
              {/* Star / Pin Button */}
              <button
                type="button"
                onClick={(e) => togglePin(e, acc.id)}
                className={cn(
                  "absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                  isPinned 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                    : "bg-white/5 border-white/5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-indigo-400 hover:bg-white/10"
                )}
                title={isPinned ? "Unpin account" : "Pin account to top"}
              >
                <Star className={cn("h-4 w-4", isPinned && "fill-indigo-400")} />
              </button>

              {/* Normal/Data Card View */}
              <div className="flex flex-col gap-2 transition-all duration-300 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {accountType}
                </span>
                <div>
                  <h3 className="text-lg font-bold leading-tight line-clamp-1 pr-6" style={{ color: "var(--text-primary)" }}>
                    {acc.name}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {acc.broker ?? "Direct EA Sync"}
                  </p>
                </div>
              </div>

              {/* Standard Balance display */}
              <div className="flex flex-col gap-1 transition-all duration-300 group-hover:-translate-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Capital / Equity
                </span>
                <span className="font-mono text-2xl font-bold tracking-tight text-white">
                  {acc.currency} {acc.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Stats overlay / last activity */}
              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--card-border)" }}>
                {/* Regular: last activity timestamp */}
                <div className="flex items-center gap-1.5 text-xs font-medium transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1" style={{ color: "var(--text-muted)" }}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(acc.last_activity)}</span>
                </div>

                {/* Hover stats overlay - slides in from bottom */}
                <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    <span>WR: {acc.win_rate}%</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    acc.net_pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {acc.net_pnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{acc.net_pnl >= 0 ? "+" : ""}{acc.net_pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-indigo-400" />
              </div>
            </Link>
          );
        })}

        {/* Add Account Card */}
        <Link
          href="/dashboard/accounts/new"
          className="group flex h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.01]"
          style={{
            borderColor: "var(--card-border)",
            color: "var(--text-muted)",
          }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-white/[0.02] text-slate-400 group-hover:border-emerald-500/30 group-hover:text-emerald-400 group-hover:bg-emerald-500/5 transition-all">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Initialize New Account
          </span>
          <p className="mt-1.5 max-w-[180px] text-xs leading-normal" style={{ color: "var(--text-muted)" }}>
            Connect an MT5 terminal or configure strategy guidelines.
          </p>
        </Link>
      </section>
    </div>
  );
}
