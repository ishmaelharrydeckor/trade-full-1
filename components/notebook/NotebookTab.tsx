"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookText, Plus, ChevronRight, Calendar, Brain } from "lucide-react";
import type { JournalEntry, Trade } from "@/types/database";
import { tradeNetPnl } from "@/lib/stats";
import { fmtSignedUsd, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import JournalEntryForm from "./JournalEntryForm";

const MENTAL_STATES = ["calm", "anxious", "confident", "distracted", "tired", "focused"] as const;
const MARKET_CONDITIONS = ["trending", "ranging", "volatile", "choppy", "low-volume"] as const;

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
    <div className="space-y-6">
      {/* Today's entry */}
      <div
        className="rounded-xl p-5 backdrop-blur"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookText className="h-4 w-4" style={{ color: 'var(--warning)' }} />
            <h3 className="text-lg font-bold">Today&apos;s Journal</h3>
          </div>
          {!todayEntry && (
            <button
              type="button"
              onClick={() => openNew()}
              className="tj-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Start today&apos;s entry
            </button>
          )}
        </div>

        {todayEntry ? (
          <div className="space-y-3">
            {todayEntry.pre_session_plan && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pre-session plan</div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{todayEntry.pre_session_plan}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {todayEntry.market_conditions && (
                <span
                  className="rounded-md px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-secondary)' }}
                >
                  Market: {todayEntry.market_conditions}
                </span>
              )}
              {todayEntry.mental_state && (
                <span
                  className="rounded-md px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-secondary)' }}
                >
                  Mindset: {todayEntry.mental_state}
                </span>
              )}
            </div>
            {todayEntry.post_session_review && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Post-session review</div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{todayEntry.post_session_review}</p>
              </div>
            )}
            {todayEntry.lessons_learned && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lessons learned</div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{todayEntry.lessons_learned}</p>
              </div>
            )}
            {tradesByDate.get(today) && (
              <div
                className="rounded-lg px-3 py-2 text-xs font-medium"
                style={{ backgroundColor: 'var(--app-elevated)', border: '1px solid var(--app-border)', color: 'var(--text-secondary)' }}
              >
                {tradesByDate.get(today)!.count} trades today · Net:{" "}
                <span
                  className="font-mono font-semibold"
                  style={{ color: tradesByDate.get(today)!.netPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                >
                  {fmtSignedUsd(tradesByDate.get(today)!.netPnl)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => openEdit(todayEntry)}
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Edit today&apos;s entry
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border-dashed p-8 text-center"
            style={{ border: '1px dashed var(--app-muted)', backgroundColor: 'var(--app-elevated)' }}
          >
            <Brain className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No journal entry for today yet.</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Plan your session before you trade. Review after.</p>
          </div>
        )}
      </div>

      {/* Past entries */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Past Entries</h3>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{pastEntries.length} entries</span>
        </div>

        {pastEntries.length === 0 ? (
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No past entries yet. Start journaling daily to build your review history.</p>
        ) : (
          <div className="space-y-2">
            {pastEntries.map((entry) => {
              const dayTrades = tradesByDate.get(entry.entry_date);
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-xl backdrop-blur transition"
                  style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-semibold">{fmtDate(entry.entry_date)}</span>
                    {entry.market_conditions && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-muted)' }}
                      >
                        {entry.market_conditions}
                      </span>
                    )}
                    {dayTrades && (
                      <span className="ml-auto text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {dayTrades.count} trades ·{" "}
                        <span
                          className="font-mono font-semibold"
                          style={{ color: dayTrades.netPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                        >
                          {fmtSignedUsd(dayTrades.netPnl)}
                        </span>
                      </span>
                    )}
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition", isExpanded && "rotate-90")} style={{ color: 'var(--text-muted)' }} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--app-border)' }}>
                      {entry.pre_session_plan && (
                        <div>
                          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Plan</div>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{entry.pre_session_plan}</p>
                        </div>
                      )}
                      {entry.post_session_review && (
                        <div>
                          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Review</div>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{entry.post_session_review}</p>
                        </div>
                      )}
                      {entry.lessons_learned && (
                        <div>
                          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lessons</div>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{entry.lessons_learned}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Edit entry
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
