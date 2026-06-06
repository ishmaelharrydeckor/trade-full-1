// components/notebook/NotebookTab.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookText, Plus, ChevronRight, Calendar, Brain, HelpCircle, Edit2 } from "lucide-react";
import type { JournalEntry, Trade } from "@/types/database";
import { tradeNetPnl } from "@/lib/stats";
import { fmtSignedUsd, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import JournalEntryForm from "./JournalEntryForm";

export default function NotebookTab({
  accountId,
  entries: initialEntries,
  trades,
}: {
  accountId: string;
  entries: JournalEntry[];
  trades: Trade[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((e) => e.entry_date === today);

  // Group trades by date for linking
  const tradesByDate = useMemo(() => {
    const map = new Map<string, { count: number; netPnl: number }>();
    for (const t of trades) {
      const d = new Date(t.close_time ?? t.open_time);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const bucket = map.get(dateStr) ?? { count: 0, netPnl: 0 };
      bucket.count++;
      bucket.netPnl += tradeNetPnl(t);
      map.set(dateStr, bucket);
    }
    return map;
  }, [trades]);

  function handleSaved(entry: JournalEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
    setShowForm(false);
    setEditingEntry(null);
    setEditingDate(null);
    router.refresh();
  }

  function openNew(date?: string) {
    setEditingEntry(null);
    setEditingDate(date ?? today);
    setShowForm(true);
  }

  function openEdit(entry: JournalEntry) {
    setEditingEntry(entry);
    setEditingDate(null);
    setShowForm(true);
  }

  const pastEntries = entries.filter((e) => e.entry_date !== today).sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* SECTION 1: TODAY'S JOURNAL ENTRY */}
      <div 
        className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-6 shadow-sm transition-all"
        style={{ borderColor: "var(--border-panel)" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookText className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-lg font-bold tracking-tight text-white">Today&apos;s Reflections</h3>
          </div>
          {!todayEntry && (
            <button
              type="button"
              onClick={() => openNew()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-650 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 shadow-md shadow-indigo-500/10 active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" /> Start today&apos;s entry
            </button>
          )}
        </div>

        {todayEntry ? (
          <div className="space-y-6">
            
            {/* Plan block */}
            {todayEntry.pre_session_plan && (
              <div className="border-l-2 border-indigo-500/20 pl-4 py-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                  Pre-session plan
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {todayEntry.pre_session_plan}
                </p>
              </div>
            )}

            {/* Conditions and Mindsets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {todayEntry.market_conditions && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400">
                  Market: {todayEntry.market_conditions}
                </span>
              )}
              {todayEntry.mental_state && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400">
                  Mindset: {todayEntry.mental_state}
                </span>
              )}
              {/* Tags display */}
              {((todayEntry as any).tags ?? []).map((tag: string) => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-indigo-500/10 bg-indigo-500/[0.02] text-indigo-400">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Review block */}
            {todayEntry.post_session_review && (
              <div className="border-l-2 border-indigo-500/20 pl-4 py-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                  Post-session review
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {todayEntry.post_session_review}
                </p>
              </div>
            )}

            {/* Lessons block */}
            {todayEntry.lessons_learned && (
              <div className="border-l-2 border-emerald-500/20 pl-4 py-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                  Lessons learned
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {todayEntry.lessons_learned}
                </p>
              </div>
            )}

            {/* Account Trade summary linking */}
            {tradesByDate.get(today) && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3.5 text-xs text-slate-400 flex items-center justify-between">
                <span>Today&apos;s activity: {tradesByDate.get(today)!.count} trades logged</span>
                <span className="font-mono font-bold text-slate-200">
                  Net:{" "}
                  <span className={tradesByDate.get(today)!.netPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {fmtSignedUsd(tradesByDate.get(today)!.netPnl)}
                  </span>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => openEdit(todayEntry)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-350 transition-colors uppercase tracking-widest"
            >
              <Edit2 className="h-3 w-3" /> Edit Entry
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/[0.04] p-10 text-center">
            <Brain className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No reflections logged for today yet.</p>
            <p className="mt-1.5 text-xs text-slate-500 leading-normal max-w-sm mx-auto">
              Plan your capital allocation targets before trading. Review your setups afterward.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: PAST JOURNAL ENTRIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-1">
          <h3 className="text-md font-bold text-white tracking-tight">Timeline Log</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{pastEntries.length} entries</span>
        </div>

        {pastEntries.length === 0 ? (
          <div className="text-center py-8 text-xs font-medium text-slate-500 leading-relaxed">
            No entries found in archive. Form consistency habits by starting entries daily.
          </div>
        ) : (
          <div className="space-y-3">
            {pastEntries.map((entry) => {
              const dayTrades = tradesByDate.get(entry.entry_date);
              const isExpanded = expandedId === entry.id;
              const hasTags = (entry as any).tags && (entry as any).tags.length > 0;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-xl border transition-colors duration-250 bg-[#0f1318]/30",
                    isExpanded ? "bg-[#141a22]/40 border-slate-700/60" : "border-slate-800/80 hover:border-slate-700"
                  )}
                >
                  {/* Header Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left select-none"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-200">{fmtDate(entry.entry_date)}</span>
                      {entry.market_conditions && (
                        <span className="rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                          {entry.market_conditions}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {dayTrades && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {dayTrades.count} trades ·{" "}
                          <span className={cn("font-mono font-bold", dayTrades.netPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {fmtSignedUsd(dayTrades.netPnl)}
                          </span>
                        </span>
                      )}
                      <ChevronRight className={cn("h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0", isExpanded && "rotate-90")} />
                    </div>
                  </button>

                  {/* Expanded Body Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-800/80 pt-4 bg-black/10">
                      
                      {/* Plan block */}
                      {entry.pre_session_plan && (
                        <div className="border-l border-slate-800 pl-3.5 py-0.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Plan</span>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">{entry.pre_session_plan}</p>
                        </div>
                      )}

                      {/* Review block */}
                      {entry.post_session_review && (
                        <div className="border-l border-slate-800 pl-3.5 py-0.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Review</span>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">{entry.post_session_review}</p>
                        </div>
                      )}

                      {/* Lessons block */}
                      {entry.lessons_learned && (
                        <div className="border-l border-slate-800 pl-3.5 py-0.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Lessons</span>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">{entry.lessons_learned}</p>
                        </div>
                      )}

                      {/* Tags display */}
                      {hasTags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {((entry as any).tags).map((tag: string) => (
                            <span key={tag} className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/10 bg-indigo-500/[0.02] text-indigo-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-350 transition-colors uppercase tracking-widest"
                      >
                        <Edit2 className="h-3 w-3" /> Edit Entry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <JournalEntryForm
          accountId={accountId}
          initial={editingEntry}
          initialDate={editingDate}
          onClose={() => { setShowForm(false); setEditingEntry(null); setEditingDate(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
