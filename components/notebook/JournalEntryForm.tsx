"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { JournalEntry } from "@/types/database";

const MARKET_CONDITIONS = ["trending", "ranging", "volatile", "choppy", "low-volume"] as const;
const MENTAL_STATES = ["calm", "anxious", "confident", "distracted", "tired", "focused"] as const;

export default function JournalEntryForm({
  accountId,
  initial,
  initialDate,
  onClose,
  onSaved,
}: {
  accountId: string;
  initial: JournalEntry | null;
  initialDate: string | null;
  onClose: () => void;
  onSaved: (entry: JournalEntry) => void;
}) {
  const router = useRouter();
  const editing = !!initial;
  const dateValue = initial?.entry_date ?? initialDate ?? new Date().toISOString().slice(0, 10);

  const [entryDate, setEntryDate] = useState(dateValue);
  const [preSessionPlan, setPreSessionPlan] = useState(initial?.pre_session_plan ?? "");
  const [postSessionReview, setPostSessionReview] = useState(initial?.post_session_review ?? "");
  const [marketConditions, setMarketConditions] = useState(initial?.market_conditions ?? "");
  const [mentalState, setMentalState] = useState(initial?.mental_state ?? "");
  const [lessonsLearned, setLessonsLearned] = useState(initial?.lessons_learned ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired"); setSaving(false); return; }

    const payload = {
      user_id: user.id,
      account_id: accountId,
      entry_date: entryDate,
      pre_session_plan: preSessionPlan.trim() || null,
      post_session_review: postSessionReview.trim() || null,
      market_conditions: marketConditions || null,
      mental_state: mentalState || null,
      lessons_learned: lessonsLearned.trim() || null,
    };

    const { data, error: writeErr } = editing
      ? await supabase.from("journal_entries").update(payload).eq("id", initial!.id).select().single()
      : await supabase.from("journal_entries").upsert(payload, { onConflict: "account_id,entry_date" }).select().single();

    if (writeErr) { setError(writeErr.message); setSaving(false); return; }
    onSaved(data as JournalEntry);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit journal entry" : "New journal entry"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="tj-input" disabled={editing} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Pre-session plan</label>
            <textarea value={preSessionPlan} onChange={(e) => setPreSessionPlan(e.target.value)} rows={4} placeholder="What's my bias today? Key levels to watch? News events?" className="tj-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Market conditions</label>
              <select value={marketConditions} onChange={(e) => setMarketConditions(e.target.value)} className="tj-input">
                <option value="">Select…</option>
                {MARKET_CONDITIONS.map((mc) => (
                  <option key={mc} value={mc}>{mc.charAt(0).toUpperCase() + mc.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Mental state</label>
              <select value={mentalState} onChange={(e) => setMentalState(e.target.value)} className="tj-input">
                <option value="">Select…</option>
                {MENTAL_STATES.map((ms) => (
                  <option key={ms} value={ms}>{ms.charAt(0).toUpperCase() + ms.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Post-session review</label>
            <textarea value={postSessionReview} onChange={(e) => setPostSessionReview(e.target.value)} rows={4} placeholder="How did the session go? Did I follow my plan? What went well?" className="tj-input" />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Lessons learned</label>
            <textarea value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} rows={2} placeholder="Key takeaways from today…" className="tj-input" />
          </div>

          {error && (
            <div
              className="rounded-lg p-3 text-sm font-medium"
              style={{
                border: '1px solid color-mix(in srgb, var(--negative) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)',
                color: 'var(--negative)',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="tj-btn-secondary px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="tj-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
