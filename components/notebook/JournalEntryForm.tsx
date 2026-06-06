// components/notebook/JournalEntryForm.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { JournalEntry } from "@/types/database";
import { cn } from "@/lib/utils";

const MARKET_CONDITIONS = ["trending", "ranging", "volatile", "choppy", "low-volume"] as const;
const MENTAL_STATES = ["calm", "anxious", "confident", "distracted", "tired", "focused"] as const;

const TAG_PRESETS = [
  "FOMO",
  "Revenge Risk",
  "Over-Leveraged",
  "Plan Followed",
  "High Confidence",
  "Rushed Entry",
  "Good Patience",
  "Hesitation",
];

const PRE_PLAN_PROMPTS = [
  "Why am I speculating today?",
  "Key support/resistance levels?",
  "High-impact news events to avoid?",
];

const POST_REVIEW_PROMPTS = [
  "Did I respect my daily risk ceiling?",
  "Did I check playbook rules before entry?",
  "How was my emotional control during drawdown?",
];

interface FormProps {
  accountId: string;
  initial: JournalEntry | null;
  initialDate: string | null;
  onClose: () => void;
  onSaved: (entry: JournalEntry) => void;
}

export default function JournalEntryForm({
  accountId,
  initial,
  initialDate,
  onClose,
  onSaved,
}: FormProps) {
  const router = useRouter();
  const editing = !!initial;
  const dateValue = initial?.entry_date ?? initialDate ?? new Date().toISOString().slice(0, 10);

  const [entryDate, setEntryDate] = useState(dateValue);
  const [preSessionPlan, setPreSessionPlan] = useState(initial?.pre_session_plan ?? "");
  const [postSessionReview, setPostSessionReview] = useState(initial?.post_session_review ?? "");
  const [marketConditions, setMarketConditions] = useState(initial?.market_conditions ?? "");
  const [mentalState, setMentalState] = useState(initial?.mental_state ?? "");
  const [lessonsLearned, setLessonsLearned] = useState(initial?.lessons_learned ?? "");
  
  // Custom Tag System
  const initialTags = (initial as any)?.tags ?? [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const draftKey = `tj-journal-draft-${accountId}`;

  // Load Draft from LocalStorage
  useEffect(() => {
    if (!editing) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.preSessionPlan) setPreSessionPlan(parsed.preSessionPlan);
          if (parsed.postSessionReview) setPostSessionReview(parsed.postSessionReview);
          if (parsed.marketConditions) setMarketConditions(parsed.marketConditions);
          if (parsed.mentalState) setMentalState(parsed.mentalState);
          if (parsed.lessonsLearned) setLessonsLearned(parsed.lessonsLearned);
          if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
          setDraftLoaded(true);
        } catch (e) {
          console.error("Failed to load journal draft", e);
        }
      }
    }
  }, [editing, draftKey]);

  // Autosave draft to LocalStorage
  useEffect(() => {
    if (!editing) {
      const timer = setTimeout(() => {
        const payload = {
          preSessionPlan,
          postSessionReview,
          marketConditions,
          mentalState,
          lessonsLearned,
          selectedTags,
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [preSessionPlan, postSessionReview, marketConditions, mentalState, lessonsLearned, selectedTags, editing, draftKey]);

  // Clear draft local storage on save/cancel
  function clearDraft() {
    localStorage.removeItem(draftKey);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Insert Quick Prompts
  function insertPrompt(textarea: "pre" | "post", prompt: string) {
    if (textarea === "pre") {
      setPreSessionPlan((prev) => (prev ? `${prev}\n- ${prompt}\n` : `- ${prompt}\n`));
    } else {
      setPostSessionReview((prev) => (prev ? `${prev}\n- ${prompt}\n` : `- ${prompt}\n`));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      account_id: accountId,
      entry_date: entryDate,
      pre_session_plan: preSessionPlan.trim() || null,
      post_session_review: postSessionReview.trim() || null,
      market_conditions: marketConditions || null,
      mental_state: mentalState || null,
      lessons_learned: lessonsLearned.trim() || null,
      tags: selectedTags, // will fallback if column missing
    };

    try {
      const { data, error: writeErr } = editing
        ? await supabase.from("journal_entries").update(payload as any).eq("id", initial!.id).select().single()
        : await supabase.from("journal_entries").upsert(payload as any, { onConflict: "account_id,entry_date" }).select().single();

      if (writeErr) {
        // Fallback: If tags column is not configured on the remote Supabase schema yet
        // we strip the tags field and serialize tags into the lessons_learned text box.
        const tagsString = selectedTags.length > 0 ? `\n\nBehavior Tags: ${selectedTags.map(t => `#${t.replace(/\s+/g, '')}`).join(" ")}` : "";
        const fallbackPayload = {
          user_id: user.id,
          account_id: accountId,
          entry_date: entryDate,
          pre_session_plan: preSessionPlan.trim() || null,
          post_session_review: postSessionReview.trim() || null,
          market_conditions: marketConditions || null,
          mental_state: mentalState || null,
          lessons_learned: (lessonsLearned.trim() + tagsString) || null,
        };

        const { data: fallbackData, error: fallbackErr } = editing
          ? await supabase.from("journal_entries").update(fallbackPayload).eq("id", initial!.id).select().single()
          : await supabase.from("journal_entries").upsert(fallbackPayload, { onConflict: "account_id,entry_date" }).select().single();

        if (fallbackErr) throw fallbackErr;
        onSaved(fallbackData as JournalEntry);
      } else {
        onSaved(data as JournalEntry);
      }

      clearDraft();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving the journal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" 
      onClick={() => {
        clearDraft();
        onClose();
      }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-[#0f1318] border border-slate-800 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title & Close */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{editing ? "Edit Journal Entry" : "New Journal Entry"}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">
              Reflective Compounding Sheet
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              onClose();
            }}
            className="rounded-lg p-1.5 transition text-slate-400 hover:text-white bg-slate-900 border border-slate-850"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Draft Restore Badge */}
        {draftLoaded && !editing && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2 text-xs text-indigo-300 font-semibold animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>Recovered unsaved draft successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Date */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Journal Date
            </label>
            <input 
              type="date" 
              value={entryDate} 
              onChange={(e) => setEntryDate(e.target.value)} 
              className="w-full h-10 rounded-xl border border-slate-800 bg-[#07090d]/30 px-3.5 text-xs font-bold text-white outline-none transition disabled:opacity-50" 
              disabled={editing} 
            />
          </div>

          {/* Row 2: Pre-session Plan */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Pre-Session Plan (Prior to Execution)
            </label>
            <textarea 
              value={preSessionPlan} 
              onChange={(e) => setPreSessionPlan(e.target.value)} 
              rows={3} 
              placeholder="What's my bias today? Key levels to watch? High-impact news events?" 
              className="w-full rounded-xl border border-slate-800 bg-[#07090d]/30 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-600" 
            />
            {/* Quick Prompts */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {PRE_PLAN_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPrompt("pre", p)}
                  className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded transition-colors"
                >
                  + {p}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Meta dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Market Structure
              </label>
              <select 
                value={marketConditions} 
                onChange={(e) => setMarketConditions(e.target.value)} 
                className="w-full h-10 rounded-xl border border-slate-800 bg-[#07090d]/30 px-3 text-xs font-bold text-white outline-none"
              >
                <option value="" className="bg-[#0f1318]">Select condition…</option>
                {MARKET_CONDITIONS.map((mc) => (
                  <option key={mc} value={mc} className="bg-[#0f1318]">
                    {mc.charAt(0).toUpperCase() + mc.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Mental State / Flow
              </label>
              <select 
                value={mentalState} 
                onChange={(e) => setMentalState(e.target.value)} 
                className="w-full h-10 rounded-xl border border-slate-800 bg-[#07090d]/30 px-3 text-xs font-bold text-white outline-none"
              >
                <option value="" className="bg-[#0f1318]">Select mindset…</option>
                {MENTAL_STATES.map((ms) => (
                  <option key={ms} value={ms} className="bg-[#0f1318]">
                    {ms.charAt(0).toUpperCase() + ms.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Tagging presets */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Behavior & Mindset Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_PRESETS.map((t) => {
                const selected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTagToggle(t)}
                    className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all",
                      selected 
                        ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-400" 
                        : "border-slate-800 bg-slate-900/30 text-slate-500 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Post-session Review */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Post-Session Review (Retrospective Review)
            </label>
            <textarea 
              value={postSessionReview} 
              onChange={(e) => setPostSessionReview(e.target.value)} 
              rows={3} 
              placeholder="How did the execution go? Did I follow plans? Where did I leak capital?" 
              className="w-full rounded-xl border border-slate-800 bg-[#07090d]/30 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-600" 
            />
            {/* Quick Prompts */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {POST_REVIEW_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPrompt("post", p)}
                  className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded transition-colors"
                >
                  + {p}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Lessons Learned */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Lessons Learned
            </label>
            <textarea 
              value={lessonsLearned} 
              onChange={(e) => setLessonsLearned(e.target.value)} 
              rows={2} 
              placeholder="Key take-aways to build consistency for tomorrow…" 
              className="w-full rounded-xl border border-slate-800 bg-[#07090d]/30 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-600" 
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* CTAs */}
          <div className="flex justify-end gap-2 border-t border-slate-800/60 pt-4">
            <button 
              type="button" 
              onClick={() => {
                clearDraft();
                onClose();
              }} 
              className="w-24 h-9 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="inline-flex items-center justify-center gap-1.5 w-32 h-9 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editing ? "Save Changes" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
