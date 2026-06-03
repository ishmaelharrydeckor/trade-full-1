// components/backtest/BacktestListClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayCircle, Plus, Calendar, Trash2 } from "lucide-react";
import NewSessionForm from "./NewSessionForm";
import { fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BacktestSession {
  id: string;
  name: string;
  symbol: string;
  asset_class: string;
  timeframe: string;
  range_start: string;
  range_end: string;
  starting_balance: number;
  status: "active" | "completed" | "archived";
  created_at: string;
}

export default function BacktestListClient({
  accountId,
  initialSessions,
}: {
  accountId: string;
  initialSessions: BacktestSession[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this backtest session? This cannot be undone.")) return;
    setDeletingId(sessionId);
    try {
      const res = await fetch(
        `/api/backtest/sessions?sessionId=${sessionId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setSessions((s) => s.filter((x) => x.id !== sessionId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Backtester</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Replay historical price action and journal hypothetical trades.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="tj-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" /> New backtest
        </button>
      </div>

      {sessions.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center backdrop-blur"
          style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}
        >
          <PlayCircle className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-serif text-2xl">No backtest sessions yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start your first backtest to replay historical price action and test
            strategies without risking real capital.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="tj-btn-primary mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Start your first backtest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="group relative rounded-2xl border p-5 backdrop-blur transition"
              style={{
                borderColor: 'var(--app-border)',
                backgroundColor: 'var(--app-surface)',
              }}
            >
              <Link
                href={`/dashboard/accounts/${accountId}/backtest/${s.id}`}
                className="block"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-lg">{s.name}</h3>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.symbol} · {s.timeframe} ·{" "}
                      <span className="capitalize">{s.asset_class}</span>
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider"
                    style={
                      s.status === "active"
                        ? { backgroundColor: 'color-mix(in srgb, var(--positive) 10%, transparent)', color: 'var(--positive)' }
                        : s.status === "completed"
                          ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }
                          : { backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)', color: 'var(--text-secondary)' }
                    }
                  >
                    {s.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="h-3 w-3" />
                  {new Date(s.range_start).toLocaleDateString()} →{" "}
                  {new Date(s.range_end).toLocaleDateString()}
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Starting balance: {fmtUsd(s.starting_balance)}
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(s.id);
                }}
                disabled={deletingId === s.id}
                className="absolute right-3 top-3 rounded-md p-1.5 opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NewSessionForm
          accountId={accountId}
          onClose={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
