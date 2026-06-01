// components/insights/AiInsightsPanel.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  trades_count: number;
  observations: string[];
  blindspots: string[];
  discipline_notes: string | null;
  generated_at: string;
}

export default function AiInsightsPanel({
  accountId,
  hasTrades,
}: {
  accountId: string;
  hasTrades: boolean;
}) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  // Tick down the cooldown
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => {
      setCooldownSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  // Load latest on mount / when accountId changes
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/insights/latest?accountId=${accountId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setInsight(data.insight ?? null);
        if (data.insight) {
          const ageSec =
            (Date.now() - new Date(data.insight.generated_at).getTime()) /
            1000;
          const remain = 30 * 60 - ageSec; // 30-min cooldown
          if (remain > 0) setCooldownSec(Math.ceil(remain));
        }
      })
      .catch((e) => {
        if (alive) setError(String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [accountId]);

  const generate = useCallback(
    async (force: boolean) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await fetch("/api/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId, force }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to generate");
        }
        setInsight(data.insight);
        if (data.cooldownSecondsRemaining) {
          setCooldownSec(data.cooldownSecondsRemaining);
        } else {
          setCooldownSec(30 * 60);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setGenerating(false);
      }
    },
    [accountId]
  );

  const cooldownActive = cooldownSec > 0 && insight !== null;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.05] via-white/[0.02] to-transparent p-5 backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h3 className="font-serif text-lg">AI insights</h3>
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-blue-300">
              Beta
            </span>
          </div>
          {insight && (
            <p className="mt-1 text-[10px] text-slate-500">
              Generated from your last {insight.trades_count} trades ·{" "}
              {formatAgo(insight.generated_at)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => generate(insight !== null && cooldownActive)}
          disabled={
            generating || loading || !hasTrades ||
            (insight === null ? false : cooldownActive && cooldownSec > 60)
          }
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
            "disabled:cursor-not-allowed disabled:opacity-50",
            insight === null
              ? "border-blue-500/50 bg-blue-500 text-white hover:bg-blue-400"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {generating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {generating
            ? "Generating…"
            : insight
              ? cooldownActive
                ? `Refresh in ${formatCooldown(cooldownSec)}`
                : "Regenerate"
              : "Generate"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {!hasTrades ? (
        <EmptyHint message="Add or import some trades, then AI will spot patterns in your behaviour." />
      ) : loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : !insight ? (
        <EmptyHint message="Click 'Generate' for AI-powered observations and blindspots from your recent trades." />
      ) : (
        <div className="space-y-4">
          {/* Discipline note — the headline */}
          {insight.discipline_notes && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-400">
                <Quote className="h-3 w-3" />
                Focus this week
              </div>
              <p className="text-sm text-amber-100">
                {insight.discipline_notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Observations */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                What's working
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                {insight.observations.map((o, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-2.5"
                  >
                    <span className="text-emerald-400">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Blindspots */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Blindspots
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                {insight.blindspots.map((o, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg border border-red-500/10 bg-red-500/[0.03] p-2.5"
                  >
                    <span className="text-red-400">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">
            AI-generated — not financial advice. Cross-check with your own analysis.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function formatAgo(iso: string): string {
  const ageSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (ageSec < 60) return "just now";
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h ago`;
  return `${Math.floor(ageSec / 86400)}d ago`;
}

function formatCooldown(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.ceil(sec / 60);
  return `${m}m`;
}
