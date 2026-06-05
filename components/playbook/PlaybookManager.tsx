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
          <BookOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h3 className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>Your Playbooks</h3>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="tj-btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> New playbook
        </button>
      </div>

      {playbooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center backdrop-blur" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
          <BookOpen className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>No playbooks yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
            Define your trading strategies with rule checklists. Tag trades to playbooks
            to see which setups actually make money.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="tj-btn-primary mt-5 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create your first playbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {playbooks.map((pb) => (
            <div
              key={pb.id}
              className="group rounded-2xl p-5 backdrop-blur transition"
              style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-serif text-lg" style={{ color: 'var(--text-primary)' }}>{pb.name}</h4>
                  {pb.description && (
                    <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{pb.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => { setEditing(pb); setShowForm(true); }}
                    className="rounded-md p-1.5 transition"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pb.id)}
                    disabled={deletingId === pb.id}
                    className="rounded-md p-1.5 disabled:opacity-50 transition"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {pb.rules && (pb.rules as PlaybookRule[]).length > 0 && (
                <div className="mt-3 space-y-1">
                  {(pb.rules as PlaybookRule[]).slice(0, 4).map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="truncate">{rule.text}</span>
                    </div>
                  ))}
                  {(pb.rules as PlaybookRule[]).length > 4 && (
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
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
                      className="rounded-md px-2 py-0.5 text-[10px]"
                      style={{ backgroundColor: 'var(--app-surface)', color: 'var(--text-secondary)' }}
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-start md:items-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xl my-8 rounded-2xl p-6" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-bg)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl" style={{ color: 'var(--text-primary)' }}>{initial ? "Edit playbook" : "New playbook"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition" style={{ color: 'var(--text-secondary)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Break of Structure + FVG" className="tj-input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="When do you take this setup?" className="tj-input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Rules / Checklist</label>
            <div className="space-y-1.5">
              {rules.map((rule, i) => (
                <div key={rule.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-elevated)' }}>
                  <GripVertical className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{rule.text}</span>
                  <button type="button" onClick={() => removeRule(rule.id)} className="shrink-0 transition" style={{ color: 'var(--text-muted)' }}>
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
                className="tj-input flex-1"
              />
              <button type="button" onClick={addRule} className="tj-btn-secondary shrink-0">
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="breakout, reversal, scalp" className="tj-input w-full" />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg p-3 text-sm" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)', color: 'var(--negative)' }}>{error}</div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="tj-btn-secondary">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="tj-btn-primary inline-flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Save changes" : "Create playbook"}
          </button>
        </div>
      </div>
    </div>
  );
}
