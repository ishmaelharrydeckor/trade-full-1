"use client";

import { useState, useMemo } from "react";
import { Search, Star, MessageSquare, Phone, Calendar, Info, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BetaFeedbackRow {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  trading_duration: string;
  what_you_trade: string[];
  broker: string | null;
  platforms: string[];
  hear_about: string;
  has_account: string;
  features_used: string[];
  rating: number;
  impressed_feature: string;
  frustrated_feature: string;
  would_pay: string;
  max_price: string;
  wished_feature: string;
  would_recommend: string;
  other_feedback: string | null;
  submitted_at: string;
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
        f.full_name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.impressed_feature || "").toLowerCase().includes(q) ||
        (f.frustrated_feature || "").toLowerCase().includes(q) ||
        (f.wished_feature || "").toLowerCase().includes(q)
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
                  <h3 className="font-medium text-slate-200">{f.full_name}</h3>
                  <p className="text-xs text-slate-400">{f.email}</p>
                </div>
                <div className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  {f.rating}
                </div>
              </div>

              {/* Impressed summary preview */}
              <p className="mt-3 line-clamp-2 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">Impressed: </span>
                {f.impressed_feature}
              </p>

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
                <span>{f.trading_duration} experience</span>
                <span>{new Date(f.submitted_at).toLocaleDateString()}</span>
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
              <h2 className="text-xl font-bold text-slate-200">{selectedFeedback.full_name}</h2>
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
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Experience</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">{selectedFeedback.trading_duration}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Broker / Platform</span>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {selectedFeedback.broker || "—"} / {selectedFeedback.platforms.join(", ") || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Would Pay / Max</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                {selectedFeedback.would_pay} ({selectedFeedback.max_price})
              </p>
            </div>
          </div>

          {/* Responses */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> What impressed them most
              </h4>
              <p className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.impressed_feature}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> What frustrated them most
              </h4>
              <p className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.frustrated_feature}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Wished feature (#1)
              </h4>
              <p className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.wished_feature}
              </p>
            </div>

            {selectedFeedback.other_feedback && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Other comments
                </h4>
                <p className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.other_feedback}
                </p>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-y-2 gap-x-6 border-t border-white/5 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-slate-500" /> Source: {selectedFeedback.hear_about}
            </span>
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" /> Created Account: {selectedFeedback.has_account}
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
