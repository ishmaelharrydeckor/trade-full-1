// components/insights/SessionAuditCard.tsx
"use client";

import { useState, useMemo } from "react";
import { X, Award, CheckCircle, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EMOTIONAL_STATES = [
  "Patient",
  "Focused",
  "Confident",
  "Disciplined",
  "Fearful",
  "Anxious",
  "FOMO",
  "Frustrated",
  "Revenge Trading",
  "Overconfident",
  "Impulsive",
  "Neutral"
];

interface RuleQuestion {
  id: string;
  label: string;
  fieldName: "followed_plan" | "respected_risk" | "avoided_revenge" | "avoided_emotional" | "waited_setup" | "respected_sl";
}

const QUESTIONS: RuleQuestion[] = [
  { id: "plan", label: "Did you follow your trading plan?", fieldName: "followed_plan" },
  { id: "risk", label: "Did you respect your risk limits?", fieldName: "respected_risk" },
  { id: "revenge", label: "Did you avoid revenge trading?", fieldName: "avoided_revenge" },
  { id: "emotional", label: "Did you avoid emotional entries?", fieldName: "avoided_emotional" },
  { id: "setup", label: "Did you wait for your setup?", fieldName: "waited_setup" },
  { id: "sl", label: "Did you respect stop losses?", fieldName: "respected_sl" }
];

export default function SessionAuditCard({
  isOpen,
  onClose,
  accountId,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onSubmitted: () => void;
}) {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({
    followed_plan: null,
    respected_risk: null,
    avoided_revenge: null,
    avoided_emotional: null,
    waited_setup: null,
    respected_sl: null,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live execution score
  const executionScore = useMemo(() => {
    const values = Object.values(answers);
    const completed = values.filter((v) => v !== null);
    if (completed.length === 0) return 0;
    const scoreVal = values.filter((v) => v === true).length;
    return Math.round((scoreVal / values.length) * 100);
  }, [answers]);

  const allAnswered = useMemo(() => {
    return Object.values(answers).every((v) => v !== null) && selectedEmotions.length > 0;
  }, [answers, selectedEmotions]);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleAnswer = (field: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const todayStr = new Date().toISOString().split("T")[0];

      const { error: upsertError } = await supabase
        .from("session_audits")
        .upsert({
          user_id: user.id,
          account_id: accountId,
          audit_date: todayStr,
          emotional_states: selectedEmotions,
          followed_plan: answers.followed_plan,
          respected_risk: answers.respected_risk,
          avoided_revenge: answers.avoided_revenge,
          avoided_emotional: answers.avoided_emotional,
          waited_setup: answers.waited_setup,
          respected_sl: answers.respected_sl,
          execution_score: executionScore,
        }, { onConflict: "account_id,audit_date" });

      if (upsertError) throw upsertError;

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong saving the audit.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div 
        className="relative z-10 flex flex-col w-full max-w-lg rounded-2xl border bg-[#0c0f14] shadow-2xl overflow-hidden max-h-[90vh]"
        style={{ borderColor: "var(--border-panel)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-2 bg-indigo-500/10 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Session Audit Card</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evaluate discipline and process execution today</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/10 p-3.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question 1: Emotional State */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. How would you describe your emotional state today? (Select all that apply)
            </h4>
            <div className="flex flex-wrap gap-2">
              {EMOTIONAL_STATES.map((emotion) => {
                const selected = selectedEmotions.includes(emotion);
                const isPositive = ["Patient", "Focused", "Confident", "Disciplined"].includes(emotion);
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition duration-200",
                      selected
                        ? isPositive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5"
                          : "bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5"
                        : "bg-slate-800/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    )}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Rule Compliance Checklist */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Rule Compliance Checklist
            </h4>
            <div className="space-y-2.5">
              {QUESTIONS.map((q) => {
                const currentAns = answers[q.fieldName];
                return (
                  <div 
                    key={q.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-black/10 p-3 hover:border-slate-800 transition duration-150"
                  >
                    <span className="text-xs font-semibold text-slate-300">{q.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAnswer(q.fieldName, true)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 border",
                          currentAns === true
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-extrabold"
                            : "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswer(q.fieldName, false)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 border",
                          currentAns === false
                            ? "bg-red-500/10 border-red-500/20 text-red-400 font-extrabold"
                            : "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer & Live Score Banner */}
        <div className="border-t border-slate-800 p-5 bg-[#080a0e]/90 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Execution Score</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5">{executionScore}%</span>
          </div>

          <button
            type="button"
            disabled={!allAnswered || saving}
            onClick={handleSubmit}
            className="tj-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Review</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Save Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
