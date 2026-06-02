"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  GripVertical,
  CheckCircle,
} from "lucide-react";
import type { Playbook, PlaybookRule } from "@/types/database";
import { cn } from "@/lib/utils";

function generateId() {
  return crypto.randomUUID();
}

export default function PlaybookManager({
  accountId,
  playbooks: initialPlaybooks,
}: {
  accountId: string;
  playbooks: Playbook[];
}) {
  const router = useRouter();
  const [playbooks, setPlaybooks] = useState(initialPlaybooks);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this playbook? Trades linked to it will keep their data.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/playbooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlaybooks((p) => p.filter((x) => x.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(playbook: Playbook) {
    if (editing) {
      setPlaybooks((p) => p.map((x) => (x.id === playbook.id ? playbook : x)));
    } else {
      setPlaybooks((p) => [playbook, ...p]);
    }
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-400" />
          <h3 className="font-serif text-lg">Your Playbooks</h3>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-400"
        >
          <Plus className="h-3.5 w-3.5" /> New playbook
        </button>
      </div>

      {playbooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <h3 className="font-serif text-xl">No playbooks yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Define your trading strategies with rule checklists. Tag trades to playbooks
            to see which setups actually make money.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
          >
            <Plus className="h-4 w-4" /> Create your first playbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {playbooks.map((pb) => (
            <div
              key={pb.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur transition hover:border-blue-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-serif text-lg">{pb.name}</h4>
                  {pb.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{pb.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => { setEditing(pb); setShowForm(true); }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pb.id)}
                    disabled={deletingId === pb.id}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {pb.rules && (pb.rules as PlaybookRule[]).length > 0 && (
                <div className="mt-3 space-y-1">
                  {(pb.rules as PlaybookRule[]).slice(0, 4).map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="truncate">{rule.text}</span>
                    </div>
                  ))}
                  {(pb.rules as PlaybookRule[]).length > 4 && (
                    <p className="text-[10px] text-slate-500">
                      +{(pb.rules as PlaybookRule[]).length - 4} more rules
                    </p>
                  )}
                </div>
              )}

              {pb.tags && pb.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {pb.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PlaybookForm
          accountId={accountId}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function PlaybookForm({
  accountId,
  initial,
  onClose,
  onSaved,
}: {
  accountId: string;
  initial: Playbook | null;
  onClose: () => void;
  onSaved: (pb: Playbook) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [rules, setRules] = useState<PlaybookRule[]>(
    (initial?.rules as PlaybookRule[]) ?? []
  );
  const [tagsRaw, setTagsRaw] = useState(initial?.tags?.join(", ") ?? "");
  const [newRule, setNewRule] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRule() {
    if (!newRule.trim()) return;
    setRules((prev) => [
      ...prev,
      { id: generateId(), text: newRule.trim(), order: prev.length },
    ]);
    setNewRule("");
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = { accountId, name: name.trim(), description: description.trim() || null, rules, tags };

    try {
      const url = initial ? `/api/playbooks/${initial.id}` : "/api/playbooks";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSaved(data.playbook);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[color:var(--bg-panel)] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{initial ? "Edit playbook" : "New playbook"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Break of Structure + FVG" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="When do you take this setup?" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Rules / Checklist</label>
            <div className="space-y-1.5">
              {rules.map((rule, i) => (
                <div key={rule.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                  <GripVertical className="h-3 w-3 shrink-0 text-slate-600" />
                  <span className="flex-1 text-sm">{rule.text}</span>
                  <button type="button" onClick={() => removeRule(rule.id)} className="shrink-0 text-slate-500 hover:text-red-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
                placeholder="Add a rule…"
                className={cn(inputClass, "flex-1")}
              />
              <button type="button" onClick={addRule} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Tags (comma-separated)</label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="breakout, reversal, scalp" className={inputClass} />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Save changes" : "Create playbook"}
          </button>
        </div>
      </div>
    </div>
  );
}
