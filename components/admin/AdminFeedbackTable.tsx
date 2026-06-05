"use client";

import { useState, useMemo } from "react";
import { Search, Star, MessageSquare, Phone, Calendar, Info, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BetaFeedbackRow {
  id: string;
  created_at: string;
  email: string;
  whatsapp: string | null;
  logged_trades: string;
  previous_tracking: string;
  previous_tracking_other: string | null;
  features_used: string[];
  what_frustrated: string | null;
  what_was_missing: string | null;
  sean_ellis_score: string;
  would_recommend: string;
  anything_else: string | null;
  full_name: string | null;
  trading_experience: string | null;
  what_they_trade: string[] | null;
  broker: string | null;
  platform: string | null;
  heard_from: string | null;
}

export default function AdminFeedbackTable({
  feedback,
}: {
  feedback: BetaFeedbackRow[];
}) {
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<BetaFeedbackRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return feedback;
    return feedback.filter(
      (f) =>
        (f.full_name || "").toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.what_frustrated || "").toLowerCase().includes(q) ||
        (f.what_was_missing || "").toLowerCase().includes(q) ||
        (f.anything_else || "").toLowerCase().includes(q)
    );
  }, [feedback, search]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left List Pane */}
      <div className={cn("space-y-4", selectedFeedback ? "lg:col-span-1" : "lg:col-span-3")}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search feedback content, names, or emails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500/50"
          />
        </div>

        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFeedback(f)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition hover:bg-white/[0.04]",
                selectedFeedback?.id === f.id
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-white/5 bg-white/[0.01]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-200">{f.full_name || f.email.split("@")[0]}</h3>
                  <p className="text-xs text-slate-400">{f.email}</p>
                </div>
                <div className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-semibold text-blue-400">
                  PMF: {f.sean_ellis_score}
                </div>
              </div>

              {/* Frustrated summary preview */}
              {f.what_frustrated && (
                <p className="mt-3 line-clamp-2 text-xs text-slate-300">
                  <span className="font-semibold text-red-400">Frustrated: </span>
                  {f.what_frustrated}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
                <span>{f.trading_experience || "No trading experience given"}</span>
                <span>{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-white/10 rounded-xl">
              No feedback submissions match your search.
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedFeedback && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-200">{selectedFeedback.full_name || "Anonymous"}</h2>
              <p className="text-sm text-slate-400">{selectedFeedback.email}</p>
              {selectedFeedback.whatsapp && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{selectedFeedback.whatsapp}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedFeedback(null)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Close Details
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Trading Exp</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">{selectedFeedback.trading_experience || "—"}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Broker / Platform</span>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {selectedFeedback.broker || "—"} / {selectedFeedback.platform || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Logged / Recommend</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                {selectedFeedback.logged_trades} / {selectedFeedback.would_recommend}
              </p>
            </div>
          </div>

          {/* Responses */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> What frustrated them most
              </h4>
              <p className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.what_frustrated || "(nothing)"}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> What they expected that was missing
              </h4>
              <p className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.what_was_missing || "(nothing)"}
              </p>
            </div>

            {selectedFeedback.anything_else && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Anything else to share
                </h4>
                <p className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.anything_else}
                </p>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-y-2 gap-x-6 border-t border-white/5 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-slate-500" /> Heard from: {selectedFeedback.heard_from || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" /> Tracked before: {selectedFeedback.previous_tracking} {selectedFeedback.previous_tracking_other ? `(${selectedFeedback.previous_tracking_other})` : ""}
            </span>
            {selectedFeedback.features_used.length > 0 && (
              <span className="w-full mt-1 flex flex-wrap gap-1 items-center">
                <span className="text-slate-500">Features used:</span>
                {selectedFeedback.features_used.map((feat) => (
                  <span key={feat} className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px]">
                    {feat}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
