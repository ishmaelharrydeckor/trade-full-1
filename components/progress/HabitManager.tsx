"use client";

import { useState } from "react";
import { X, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DailyHabit } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES = ["trading", "lifestyle", "preparation"] as const;
const AUTO_RULES = [
  { type: "max_trades", label: "Max trades per day", needsValue: true, placeholder: "3" },
  { type: "max_loss", label: "Max daily loss ($)", needsValue: true, placeholder: "500" },
  { type: "always_stop_loss", label: "Always use stop loss", needsValue: false },
] as const;

export default function HabitManager({
  accountId,
  habits: initialHabits,
  onClose,
  onUpdate,
}: {
  accountId: string;
  habits: DailyHabit[];
  onClose: () => void;
  onUpdate: (habits: DailyHabit[]) => void;
}) {
  const [habits, setHabits] = useState(initialHabits);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("trading");
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [autoRuleType, setAutoRuleType] = useState("max_trades");
  const [autoRuleValue, setAutoRuleValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function addHabit() {
    if (!newName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const autoRule = isAutomatic
      ? { type: autoRuleType, value: autoRuleValue ? Number(autoRuleValue) : undefined }
      : null;

    const { data, error } = await supabase
      .from("daily_habits")
      .insert({
        user_id: user.id,
        account_id: accountId,
        name: newName.trim(),
        category: newCategory,
        is_automated: isAutomatic,
        auto_rule: autoRule,
        sort_order: habits.length,
      })
      .select()
      .single();

    if (data) {
      const updated = [...habits, data as DailyHabit];
      setHabits(updated);
      onUpdate(updated);
      setNewName("");
      setIsAutomatic(false);
    }
    setSaving(false);
  }

  async function deleteHabit(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("daily_habits").update({ archived: true }).eq("id", id);
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    onUpdate(updated);
    setDeletingId(null);
  }

  const selectedAutoRule = AUTO_RULES.find((r) => r.type === autoRuleType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-bg)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl" style={{ color: 'var(--text-primary)' }}>Manage Habits</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition" style={{ color: 'var(--text-secondary)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing habits */}
        <div className="mb-5 space-y-1.5">
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-elevated)' }}>
              {habit.is_automated && <Zap className="h-3 w-3 shrink-0" style={{ color: 'var(--warning)' }} />}
              <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{habit.name}</span>
              <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--app-surface)', color: 'var(--text-muted)' }}>{habit.category}</span>
              <button
                type="button"
                onClick={() => deleteHabit(habit.id)}
                disabled={deletingId === habit.id}
                className="shrink-0 disabled:opacity-50 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {habits.length === 0 && (
            <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No habits yet. Add your first one below.</p>
          )}
        </div>

        {/* Add new habit */}
        <div className="space-y-3 rounded-xl p-4" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-elevated)' }}>
          <h4 className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Add habit</h4>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Review playbook before trading" className="tj-input w-full" />
          <div className="flex gap-2">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="tj-input flex-1">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={isAutomatic} onChange={(e) => setIsAutomatic(e.target.checked)} className="rounded" />
              Auto-check
            </label>
          </div>

          {isAutomatic && (
            <div className="flex gap-2">
              <select value={autoRuleType} onChange={(e) => setAutoRuleType(e.target.value)} className="tj-input flex-1">
                {AUTO_RULES.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
              </select>
              {selectedAutoRule?.needsValue && (
                <input type="number" value={autoRuleValue} onChange={(e) => setAutoRuleValue(e.target.value)} placeholder={selectedAutoRule.placeholder} className="tj-input w-24" />
              )}
            </div>
          )}

          <button type="button" onClick={addHabit} disabled={saving || !newName.trim()} className="tj-btn-primary inline-flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add habit
          </button>
        </div>
      </div>
    </div>
  );
}
