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

  const inputClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[color:var(--bg-panel)] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{editing ? "Edit journal entry" : "New journal entry"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Date</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClass} disabled={editing} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Pre-session plan</label>
            <textarea value={preSessionPlan} onChange={(e) => setPreSessionPlan(e.target.value)} rows={4} placeholder="What's my bias today? Key levels to watch? News events?" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Market conditions</label>
              <select value={marketConditions} onChange={(e) => setMarketConditions(e.target.value)} className={inputClass}>
                <option value="" className="bg-slate-900">Select…</option>
                {MARKET_CONDITIONS.map((mc) => (
                  <option key={mc} value={mc} className="bg-slate-900">{mc.charAt(0).toUpperCase() + mc.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Mental state</label>
              <select value={mentalState} onChange={(e) => setMentalState(e.target.value)} className={inputClass}>
                <option value="" className="bg-slate-900">Select…</option>
                {MENTAL_STATES.map((ms) => (
                  <option key={ms} value={ms} className="bg-slate-900">{ms.charAt(0).toUpperCase() + ms.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Post-session review</label>
            <textarea value={postSessionReview} onChange={(e) => setPostSessionReview(e.target.value)} rows={4} placeholder="How did the session go? Did I follow my plan? What went well?" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Lessons learned</label>
            <textarea value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} rows={2} placeholder="Key takeaways from today…" className={inputClass} />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
