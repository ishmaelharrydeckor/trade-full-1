// components/dashboard/OnboardingHub.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Star, ArrowRight, TrendingUp, TrendingDown, Clock, ShieldCheck, HelpCircle, Code } from "lucide-react";
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
    if (!dateStr) return "No recent activity";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Active just now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays === 1) return "Active yesterday";
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return `Active ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }

  // Deduce account type label and colors
  function getAccountBadgeMeta(name: string, broker: string | null) {
    const bLower = (broker ?? "").toLowerCase();
    const nLower = name.toLowerCase();

    const propFirms = ["ftmo", "fundednext", "apex", "pips", "e8", "topstep", "bespoke"];
    const isProp = propFirms.some((pf) => bLower.includes(pf) || nLower.includes(pf));

    if (isProp) {
      return {
        label: "Funded",
        classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    }
    if (nLower.includes("demo") || bLower.includes("demo")) {
      return {
        label: "Demo",
        classes: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
    }
    return {
      label: "Live",
      classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          Welcome back,{" "}
          <span className="font-serif italic font-normal text-indigo-400">
            {displayName}
          </span>
        </h1>
        <p className="text-sm font-medium text-slate-400">
          Choose an account to continue
        </p>
      </section>

      {/* Grid wrapper */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedAccounts.map((acc) => {
          const isPinned = acc.id === pinnedId;
          const badgeMeta = getAccountBadgeMeta(acc.name, acc.broker);
          
          return (
            <Link
              key={acc.id}
              href={`/dashboard/accounts/${acc.id}`}
              className={cn(
                "group relative flex h-[240px] flex-col justify-between rounded-2xl border p-6 transition-all duration-300",
                "bg-[#0f1318]/60 backdrop-blur-md hover:translate-y-[-4px]",
                isPinned 
                  ? "border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.06)]" 
                  : "border-slate-800/80 hover:border-indigo-500/30 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
              )}
            >
              {/* Star / Pin Button */}
              <button
                type="button"
                onClick={(e) => togglePin(e, acc.id)}
                className={cn(
                  "absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                  isPinned 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                    : "bg-slate-900/50 border-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-indigo-400 hover:border-indigo-500/30"
                )}
                title={isPinned ? "Unpin account" : "Pin account to top"}
              >
                <Star className={cn("h-4 w-4 transition-transform group-hover:scale-110", isPinned && "fill-indigo-400")} />
              </button>

              {/* Top Row: Account Details & Broker */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", badgeMeta.classes)}>
                    {badgeMeta.label}
                  </span>
                  {acc.broker && (
                    <span className="text-[10px] font-semibold text-slate-500 tracking-wide truncate max-w-[120px]">
                      {acc.broker}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-100 group-hover:text-white transition-colors line-clamp-1 pr-8">
                    {acc.name}
                  </h3>
                </div>
              </div>

              {/* Middle Section: Premium Balance Typography */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Total Equity
                </span>
                <span className="font-mono text-2xl font-bold tracking-tight text-white/95 group-hover:text-white transition-colors">
                  {acc.currency} {acc.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Bottom Section: Interactive transition */}
              <div className="relative h-8 flex items-center justify-between border-t border-slate-800/80 pt-3">
                {/* Default state: last activity */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium transition-all duration-350 group-hover:opacity-0 group-hover:-translate-y-2">
                  <Clock className="h-3.5 w-3.5 text-slate-600" />
                  <span>{formatRelativeTime(acc.last_activity)}</span>
                </div>

                {/* Hover stats: slides up smoothly */}
                <div className="absolute inset-x-0 bottom-0 top-3 flex items-center justify-between opacity-0 translate-y-2 transition-all duration-350 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Win Rate:</span>
                    <span className="font-mono text-indigo-400 font-bold">{acc.win_rate}%</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold font-mono",
                    acc.net_pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {acc.net_pnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{acc.net_pnl >= 0 ? "+" : ""}{acc.net_pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Immediate navigation Indicator */}
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-900/60 border border-slate-800 group-hover:border-indigo-500/30 transition-all">
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                </div>
              </div>
            </Link>
          );
        })}

        {/* Add Account Card */}
        <Link
          href="/dashboard/accounts/new"
          className={cn(
            "group flex h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300",
            "border-slate-800 hover:border-emerald-500/40 bg-transparent hover:bg-emerald-500/[0.01]"
          )}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/50 text-slate-500 group-hover:border-emerald-500/30 group-hover:text-emerald-400 group-hover:bg-emerald-500/5 transition-all">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-200 group-hover:text-emerald-400 transition-colors">
            Add New Account
          </span>
          <p className="mt-2 max-w-[180px] text-xs leading-normal text-slate-500">
            Connect an MT5 terminal or configure strategy guidelines.
          </p>
        </Link>
      </section>
    </div>
  );
}

