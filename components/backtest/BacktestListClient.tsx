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
          <p className="mt-1 text-sm text-slate-400">
            Replay historical price action and journal hypothetical trades.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
        >
          <Plus className="h-4 w-4" /> New backtest
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur">
          <PlayCircle className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <h3 className="font-serif text-2xl">No backtest sessions yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Start your first backtest to replay historical price action and test
            strategies without risking real capital.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
          >
            <Plus className="h-4 w-4" /> Start your first backtest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur transition hover:border-blue-500/30 hover:bg-white/[0.04]"
            >
              <Link
                href={`/dashboard/accounts/${accountId}/backtest/${s.id}`}
                className="block"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-lg">{s.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {s.symbol} · {s.timeframe} ·{" "}
                      <span className="capitalize">{s.asset_class}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      s.status === "active"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : s.status === "completed"
                          ? "bg-blue-500/10 text-blue-300"
                          : "bg-slate-500/10 text-slate-400"
                    )}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(s.range_start).toLocaleDateString()} →{" "}
                  {new Date(s.range_end).toLocaleDateString()}
                </div>
                <div className="mt-1 text-xs text-slate-400">
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
                className="absolute right-3 top-3 rounded-md p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100 disabled:opacity-50"
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
