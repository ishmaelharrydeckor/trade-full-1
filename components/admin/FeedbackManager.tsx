"use client";

import { useState, useMemo } from "react";
import { Search, Download, ChevronDown, ChevronUp, Clock, User, Phone, CheckSquare } from "lucide-react";
import { type BetaFeedbackRow } from "./AdminFeedbackTable";

export default function FeedbackManager({
  feedback,
}: {
  feedback: BetaFeedbackRow[];
}) {
  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    return feedback.filter((f) => {
      const matchesSearch = f.email.toLowerCase().includes(search.toLowerCase().trim());
      const matchesFilter = filterScore === "all" ? true : f.sean_ellis_score === filterScore;
      return matchesSearch && matchesFilter;
    });
  }, [feedback, search, filterScore]);

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Created At",
      "Email",
      "WhatsApp",
      "Logged Trades",
      "Previous Tracking",
      "Previous Tracking Other",
      "Features Used",
      "What Frustrated",
      "What Was Missing",
      "Sean Ellis Score",
      "Would Recommend",
      "Anything Else",
      "Full Name",
      "Trading Experience",
      "What They Trade",
      "Broker",
      "Platform",
      "Heard From",
    ];

    const rows = filtered.map((f) => [
      f.id,
      f.created_at,
      f.email,
      f.whatsapp || "",
      f.logged_trades,
      f.previous_tracking,
      f.previous_tracking_other || "",
      (f.features_used || []).join("; "),
      f.what_frustrated || "",
      f.what_was_missing || "",
      f.sean_ellis_score,
      f.would_recommend,
      f.anything_else || "",
      f.full_name || "",
      f.trading_experience || "",
      (f.what_they_trade || []).join("; "),
      f.broker || "",
      f.platform || "",
      f.heard_from || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `beta_feedback_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500/50"
            />
          </div>

          {/* Filter */}
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-blue-500/50"
          >
            <option value="all">All PMF Scores</option>
            <option value="very">Very disappointed</option>
            <option value="somewhat">Somewhat disappointed</option>
            <option value="not">Not disappointed</option>
            <option value="not_using">I&apos;m not using it</option>
          </select>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={exportToCSV}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Sean Ellis Score</th>
              <th className="px-6 py-4">Logged Trades</th>
              <th className="px-6 py-4">Would Recommend</th>
              <th className="px-6 py-4 text-center">Has Text?</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((f) => {
              const isExpanded = !!expandedRows[f.id];
              const hasText = !!(f.what_frustrated || f.what_was_missing || f.anything_else);

              return (
                <>
                  <tr
                    key={f.id}
                    onClick={() => toggleRow(f.id)}
                    className="cursor-pointer transition hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-400">
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {f.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          f.sean_ellis_score === "very"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : f.sean_ellis_score === "somewhat"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {f.sean_ellis_score === "very"
                          ? "Very disappointed"
                          : f.sean_ellis_score === "somewhat"
                          ? "Somewhat disappointed"
                          : f.sean_ellis_score === "not"
                          ? "Not disappointed"
                          : "Not using it"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {f.logged_trades === "yes_several"
                        ? "Yes, several"
                        : f.logged_trades === "yes_few"
                        ? "Yes, just a few"
                        : f.logged_trades === "stuck"
                        ? "Tried but stuck"
                        : "Browsed"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 capitalize">
                      {f.would_recommend === "later" ? "Ask later" : f.would_recommend}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          hasText ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {hasText ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isExpanded ? (
                        <ChevronUp className="inline-block h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="inline-block h-4 w-4 text-slate-400" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="bg-white/[0.01] px-6 py-5 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Core Answers */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Feedback Details</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="block text-xs font-semibold text-slate-400">What frustrated them:</span>
                                <p className="mt-1 text-sm text-slate-200 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                                  {f.what_frustrated || "(no comments provided)"}
                                </p>
                              </div>
                              <div>
                                <span className="block text-xs font-semibold text-slate-400">What they thought it would do that it doesn&apos;t:</span>
                                <p className="mt-1 text-sm text-slate-200 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                                  {f.what_was_missing || "(no comments provided)"}
                                </p>
                              </div>
                              <div>
                                <span className="block text-xs font-semibold text-slate-400">Anything else:</span>
                                <p className="mt-1 text-sm text-slate-200 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                                  {f.anything_else || "(no comments provided)"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Demographic/Attribution Details */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitter Profile (Optional Fields)</h4>
                            <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.02] p-4 border border-white/5">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Name</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1">{f.full_name || "Anonymous"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">WhatsApp</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1">{f.whatsapp || "—"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Trading Experience</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1">{f.trading_experience || "—"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Broker</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{f.broker || "—"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Platform</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1">{f.platform || "—"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Heard From</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1">{f.heard_from || "—"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Previous Tracker</span>
                                <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                                  {f.previous_tracking} {f.previous_tracking_other ? `(${f.previous_tracking_other})` : ""}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Source Agent</span>
                                <p className="text-[10px] font-mono text-slate-400 mt-1 truncate" title={f.whatsapp || undefined}>
                                  {f.whatsapp || "None"}
                                </p>
                              </div>
                            </div>

                            {f.features_used && f.features_used.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Features Touched</span>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {f.features_used.map((feat) => (
                                    <span key={feat} className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-300">
                                      {feat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {f.what_they_trade && f.what_they_trade.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Assets Traded</span>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {f.what_they_trade.map((asset) => (
                                    <span key={asset} className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-300">
                                      {asset}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  No feedback submissions match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
