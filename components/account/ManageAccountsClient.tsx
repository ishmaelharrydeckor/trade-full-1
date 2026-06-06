// components/account/ManageAccountsClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit2,
  Archive,
  ArrowRight,
  Check,
  X,
  Plus,
  LayoutGrid,
  Filter,
  ListFilter,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface ComputedAccount {
  id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number;
  created_at: string;
  archived: boolean;
  current_balance: number;
  net_pnl: number;
  win_rate: number;
  total_trades: number;
}

interface ManageAccountsClientProps {
  initialAccounts: ComputedAccount[];
}

export default function ManageAccountsClient({ initialAccounts }: ManageAccountsClientProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ComputedAccount[]>(initialAccounts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editBroker, setEditBroker] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editStartingBalance, setEditStartingBalance] = useState<number>(0);

  // Filters & Controls
  const [sortBy, setSortBy] = useState<"performance" | "recency" | "alphabet">("recency");
  const [groupMode, setGroupMode] = useState<"none" | "type" | "broker">("none");
  const [showArchived, setShowArchived] = useState(false);

  const supabase = createClient();

  // Deduce account type (Prop Firm / Live Brokerage / Demo)
  function getAccountType(name: string, broker: string | null): string {
    const bLower = (broker ?? "").toLowerCase();
    const nLower = name.toLowerCase();
    const propFirms = ["ftmo", "fundednext", "apex", "pips", "e8", "topstep", "bespoke"];
    
    if (propFirms.some((pf) => bLower.includes(pf) || nLower.includes(pf))) {
      return "Prop Firm";
    }
    if (nLower.includes("demo") || bLower.includes("demo")) {
      return "Demo Account";
    }
    return "Personal/Live";
  }

  // Toggle Accordion Row
  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(id);
      setEditingId(null);
    }
  }

  // Start Inline Editing
  function startEdit(e: React.MouseEvent, acc: ComputedAccount) {
    e.stopPropagation();
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBroker(acc.broker ?? "");
    setEditAccountNumber(acc.account_number ?? "");
    setEditStartingBalance(acc.starting_balance);
  }

  // Save Inline Edit changes to Supabase
  async function saveEdit(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: editName,
          broker: editBroker || null,
          account_number: editAccountNumber || null,
          starting_balance: editStartingBalance,
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === id) {
            const netPnL = acc.net_pnl;
            return {
              ...acc,
              name: editName,
              broker: editBroker || null,
              account_number: editAccountNumber || null,
              starting_balance: editStartingBalance,
              current_balance: editStartingBalance + netPnL,
            };
          }
          return acc;
        })
      );
      setEditingId(null);
      router.refresh();
    } catch (err) {
      console.error("Error updating account:", err);
      alert("Failed to update account details");
    }
  }

  // Toggle archive status
  async function toggleArchive(e: React.MouseEvent, acc: ComputedAccount) {
    e.stopPropagation();
    const nextArchived = !acc.archived;
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ archived: nextArchived })
        .eq("id", acc.id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((item) => (item.id === acc.id ? { ...item, archived: nextArchived } : item))
      );
      router.refresh();
    } catch (err) {
      console.error("Error archiving account:", err);
      alert("Failed to update status");
    }
  }

  // Filter accounts by archived state
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => showArchived || !acc.archived);
  }, [accounts, showArchived]);

  // Sort function
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      if (sortBy === "performance") {
        return b.net_pnl - a.net_pnl;
      }
      if (sortBy === "alphabet") {
        return a.name.localeCompare(b.name);
      }
      // default: recency
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredAccounts, sortBy]);

  // Grouping function
  const groupedAccounts = useMemo(() => {
    if (groupMode === "none") {
      return [{ key: "All Capital Structures", list: sortedAccounts }];
    }
    const map: Record<string, ComputedAccount[]> = {};
    for (const acc of sortedAccounts) {
      const groupKey =
        groupMode === "type"
          ? getAccountType(acc.name, acc.broker)
          : (acc.broker || "Unspecified Broker");
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(acc);
    }
    return Object.entries(map).map(([key, list]) => ({ key, list }));
  }, [sortedAccounts, groupMode]);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Accounts</h1>
          <p className="text-sm text-slate-400">
            Monitor, structure, and manage all your active capital allocations.
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-500/10 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" /> Add New Account
        </Link>
      </header>

      {/* FILTER & CONTROL BAR */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0f1318]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sorting controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <ListFilter className="h-3 w-3" /> Sort:
            </span>
            <div className="flex rounded-lg bg-black/30 p-0.5 border border-slate-800">
              {[
                { id: "recency", label: "Recency" },
                { id: "performance", label: "P&L" },
                { id: "alphabet", label: "A-Z" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortBy(s.id as any)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                    sortBy === s.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouping controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <FolderOpen className="h-3 w-3" /> Group:
            </span>
            <div className="flex rounded-lg bg-black/30 p-0.5 border border-slate-800">
              {[
                { id: "none", label: "None" },
                { id: "type", label: "Type" },
                { id: "broker", label: "Broker" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupMode(g.id as any)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                    groupMode === g.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Show archived check */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-800 bg-black text-indigo-600 focus:ring-0 focus:ring-offset-0"
          />
          <span>Show deactivated accounts</span>
        </label>
      </div>

      {/* PORTFOLIO STRUCTURE */}
      <div className="space-y-6">
        {groupedAccounts.map((group) => {
          if (group.list.length === 0) return null;
          return (
            <div key={group.key} className="space-y-2">
              {/* Group Title */}
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                {group.key} ({group.list.length})
              </h3>

              {/* Rows List */}
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#0f1318]/30 overflow-hidden">
                {group.list.map((acc) => {
                  const isExpanded = expandedId === acc.id;
                  const isEditing = editingId === acc.id;
                  const accType = getAccountType(acc.name, acc.broker);

                  return (
                    <div
                      key={acc.id}
                      className={cn(
                        "group transition-colors",
                        isExpanded ? "bg-[#141a22]/40" : "hover:bg-[#141a22]/10"
                      )}
                    >
                      {/* ACCORDION HEADER */}
                      <div
                        onClick={() => toggleExpand(acc.id)}
                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 cursor-pointer select-none"
                      >
                        {/* Title & Broker */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="text-slate-500 hover:text-white transition">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-200 group-hover:text-white transition line-clamp-1">
                                {acc.name}
                              </h4>
                              {acc.archived && (
                                <span className="text-[8px] font-bold uppercase bg-red-950/40 text-red-400 border border-red-500/10 px-1.5 py-0.2 rounded">
                                  Archived
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                              {acc.broker ?? "Direct EA"} · ID: {acc.id.substring(0, 8)}
                            </span>
                          </div>
                        </div>

                        {/* Starting vs Current balance snapshot */}
                        <div className="flex items-center gap-6 text-right font-mono text-xs">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              Start Balance
                            </span>
                            <span className="text-slate-400 font-semibold">
                              {acc.currency} {acc.starting_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              Current Balance
                            </span>
                            <span className="text-white font-bold">
                              {acc.currency} {acc.current_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        {/* Performance snapshot */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              Growth / P&L
                            </span>
                            <div className={cn(
                              "text-xs font-bold font-mono flex items-center justify-end gap-1 mt-0.5",
                              acc.net_pnl >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {acc.net_pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              <span>{acc.net_pnl >= 0 ? "+" : ""}{acc.net_pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                          </div>

                          {/* Quick Action & Swtich */}
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/accounts/${acc.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hidden sm:inline-flex items-center justify-center h-8 px-3 rounded-lg border border-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:border-slate-700 bg-black/20"
                              title="Go to dashboard"
                            >
                              Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* ACCORDION CONTENT */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-black/10 p-5 flex flex-col gap-6">
                          
                          {/* STAGE 1: READ / STATS */}
                          {!isEditing ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                  Capital Allocation Type
                                </span>
                                <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-lg self-start">
                                  {accType}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                  Account Number / Symbol
                                </span>
                                <span className="text-xs font-semibold text-slate-300 font-mono">
                                  {acc.account_number ?? "Not connected"}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                  Win Rate
                                </span>
                                <span className="text-xs font-bold text-slate-300 font-mono">
                                  {acc.win_rate}% ({acc.total_trades} trades)
                                </span>
                              </div>
                              
                              {/* Metadata Control Panel */}
                              <div className="flex items-center gap-3 sm:justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => startEdit(e, acc)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit Details
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => toggleArchive(e, acc)}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                                    acc.archived
                                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                      : "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                                  )}
                                >
                                  <Archive className="h-3 w-3" /> {acc.archived ? "Activate" : "Deactivate"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* STAGE 2: EDITING MODE */
                            <div className="flex flex-col gap-4">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                Update Account Settings
                              </h5>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Account Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="rounded-lg border border-slate-850 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Broker Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editBroker}
                                    onChange={(e) => setEditBroker(e.target.value)}
                                    className="rounded-lg border border-slate-850 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Account Number / Server
                                  </label>
                                  <input
                                    type="text"
                                    value={editAccountNumber}
                                    onChange={(e) => setEditAccountNumber(e.target.value)}
                                    className="rounded-lg border border-slate-850 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Starting Capital
                                  </label>
                                  <input
                                    type="number"
                                    value={editStartingBalance}
                                    onChange={(e) => setEditStartingBalance(Number(e.target.value))}
                                    className="rounded-lg border border-slate-850 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3.5 mt-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
                                >
                                  <X className="h-3 w-3" /> Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => saveEdit(e, acc.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                                >
                                  <Check className="h-3 w-3" /> Save Changes
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
        })}
      </div>
    </div>
  );
}
