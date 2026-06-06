// components/dashboard/AccountsManagement.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Loader2,
  FolderOpen,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fmtSignedUsd, fmtPct } from "@/lib/format";

interface AccountRaw {
  id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number | null;
  ea_token: string;
  archived: boolean;
  created_at: string;
}

interface AccountsManagementProps {
  initialAccounts: AccountRaw[];
  trades: { account_id: string; pnl: number | null; close_time: string | null }[];
  transactions: { account_id: string; type: string; amount: number }[];
}

export default function AccountsManagement({
  initialAccounts,
  trades,
  transactions,
}: AccountsManagementProps) {
  const [accounts, setAccounts] = useState<AccountRaw[]>(initialAccounts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editBroker, setEditBroker] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editStartingBalance, setEditStartingBalance] = useState("");
  const [updating, setUpdating] = useState(false);

  // Filters & Sorting state
  const [sortBy, setSortBy] = useState<"recency" | "performance" | "alphabet">("recency");
  const [groupFilter, setGroupFilter] = useState<"all" | "prop" | "personal" | "archived">("all");

  const supabase = createClient();

  // Expand helper
  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(id);
      setEditingId(null);
    }
  }

  // Edit triggers
  function startEdit(acc: AccountRaw) {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBroker(acc.broker ?? "");
    setEditAccountNumber(acc.account_number ?? "");
    setEditStartingBalance(String(acc.starting_balance ?? 0));
  }

  // Save updates to Supabase
  async function saveEdit(id: string) {
    setUpdating(true);
    const balanceNum = parseFloat(editStartingBalance) || 0;
    const { error } = await supabase
      .from("accounts")
      .update({
        name: editName,
        broker: editBroker || null,
        account_number: editAccountNumber || null,
        starting_balance: balanceNum,
      })
      .eq("id", id);

    if (!error) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                name: editName,
                broker: editBroker || null,
                account_number: editAccountNumber || null,
                starting_balance: balanceNum,
              }
            : a
        )
      );
      setEditingId(null);
    } else {
      console.error(error.message);
    }
    setUpdating(false);
  }

  // Toggle archive status
  async function toggleArchive(acc: AccountRaw) {
    const nextStatus = !acc.archived;
    const { error } = await supabase
      .from("accounts")
      .update({ archived: nextStatus })
      .eq("id", acc.id);

    if (!error) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, archived: nextStatus } : a))
      );
    } else {
      console.error(error.message);
    }
  }

  // Compute performance metrics in-memory
  const computedAccounts = useMemo(() => {
    return accounts.map((acc) => {
      const accTrades = trades.filter((t) => t.account_id === acc.id);
      const accTransactions = transactions.filter((t) => t.account_id === acc.id);

      const netPnL = accTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      const depositSum = accTransactions.filter((t) => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0);
      const withdrawalSum = accTransactions.filter((t) => t.type === "withdrawal").reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = (acc.starting_balance ?? 0) + netPnL + depositSum - withdrawalSum;
      const growthPct = acc.starting_balance && acc.starting_balance > 0
        ? (netPnL / acc.starting_balance) * 100
        : 0;

      // Group classification (prop vs personal)
      const bLower = (acc.broker ?? "").toLowerCase();
      const nLower = acc.name.toLowerCase();
      const isProp = ["ftmo", "fundednext", "apex", "pips", "e8", "topstep", "bespoke"].some(
        (p) => bLower.includes(p) || nLower.includes(p)
      );

      return {
        ...acc,
        currentBalance,
        netPnL,
        growthPct,
        isProp,
      };
    });
  }, [accounts, trades, transactions]);

  // Filter & Group Accounts
  const filteredAccounts = useMemo(() => {
    return computedAccounts.filter((acc: AccountRaw & { isProp: boolean; archived: boolean }) => {
      if (groupFilter === "archived") return acc.archived;
      if (acc.archived) return false; // hide archived in standard views
      if (groupFilter === "prop") return acc.isProp;
      if (groupFilter === "personal") return !acc.isProp;
      return true;
    });
  }, [computedAccounts, groupFilter]);

  // Sort Accounts
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      if (sortBy === "performance") {
        return b.growthPct - a.growthPct;
      }
      if (sortBy === "alphabet") {
        return a.name.localeCompare(b.name);
      }
      // recency
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredAccounts, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filters and Controls Strip */}
      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
        {/* Groups */}
        <div className="flex items-center gap-1.5 rounded-lg bg-black/40 p-1 border border-white/5">
          {[
            { id: "all", label: "All Capital Structures" },
            { id: "prop", label: "Prop Firms" },
            { id: "personal", label: "Personal" },
            { id: "archived", label: "Archived" },
          ].map((group) => (
            <button
              key={group.id}
              onClick={() => setGroupFilter(group.id as any)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                groupFilter === group.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 outline-none hover:bg-white/10 transition"
          >
            <option value="recency">Sort by Recency</option>
            <option value="performance">Sort by Performance</option>
            <option value="alphabet">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Account items list */}
      <div className="space-y-3">
        {sortedAccounts.map((acc: AccountRaw & { currentBalance: number; netPnL: number; growthPct: number; isProp: boolean }) => {
          const isExpanded = expandedId === acc.id;
          const isEditing = editingId === acc.id;
          const statusTag = acc.archived ? "Paused" : "Active";

          return (
            <div
              key={acc.id}
              className="rounded-xl border transition-all"
              style={{
                backgroundColor: "var(--bg-panel)",
                borderColor: isExpanded ? "rgba(79, 70, 229, 0.4)" : "var(--border-panel)",
              }}
            >
              {/* Row Header */}
              <div
                onClick={() => toggleExpand(acc.id)}
                className="flex cursor-pointer flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Name / Broker / ID */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white line-clamp-1">{acc.name}</h3>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        acc.archived
                          ? "bg-red-500/5 border-red-500/10 text-red-400"
                          : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {statusTag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {acc.broker ?? "No Broker Listed"} · ID: {acc.account_number ?? "Unset"}
                  </p>
                </div>

                {/* Capital Metrics summary */}
                <div className="flex flex-row items-center gap-6 sm:text-right">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Balance Summary
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {acc.currency} {acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total P&L
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold flex items-center gap-1",
                        acc.netPnL >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {acc.netPnL >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {fmtSignedUsd(acc.netPnL)} ({acc.growthPct.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Accordion Arrow */}
                  <div className="text-slate-500 pl-2">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Accordion Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-white/5 p-5 bg-black/10 text-sm">
                  {isEditing ? (
                    /* Inline Edit Form */
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Broker</label>
                        <input
                          type="text"
                          value={editBroker}
                          onChange={(e) => setEditBroker(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account number</label>
                        <input
                          type="text"
                          value={editAccountNumber}
                          onChange={(e) => setEditAccountNumber(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Starting Balance</label>
                        <input
                          type="number"
                          value={editStartingBalance}
                          onChange={(e) => setEditStartingBalance(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      {/* Save buttons */}
                      <div className="md:col-span-4 flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(acc.id)}
                          disabled={updating}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-white/5 border border-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Info & Actions Grid */
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Live EA Synchronization Token
                          </span>
                          <code className="mt-1 block rounded bg-black/40 p-2 font-mono text-xs text-emerald-400 border border-white/5 break-all max-w-lg">
                            {acc.ea_token}
                          </code>
                        </div>

                        <div className="flex gap-4 text-xs font-medium text-slate-400">
                          <span>
                            Starting Capital: <strong className="text-slate-200">{acc.currency} {acc.starting_balance?.toLocaleString()}</strong>
                          </span>
                          <span>
                            Created date: <strong className="text-slate-200">{new Date(acc.created_at).toLocaleDateString()}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/accounts/${acc.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Enter Dashboard</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(acc)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit Parameters</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleArchive(acc)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition",
                            acc.archived
                              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10"
                              : "bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10"
                          )}
                        >
                          {acc.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          <span>{acc.archived ? "Activate" : "Pause / Archive"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
