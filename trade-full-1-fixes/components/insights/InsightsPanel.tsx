"use client";

// components/insights/InsightsPanel.tsx
// AI Insights panel using Gemini 2.5 Flash.
// Optimistic UI lock prevents button spam before the first DB write resolves.
// Server-side 30-min cooldown is enforced in /api/insights; this component
// also shows the remaining cooldown time returned in the API response.

import { useState } from "react";

interface Insight {
  id: string;
  created_at: string;
  focus_areas: string[];
  blindspots: string[];
  observations: string[];
  cooldown_until?: string | null;
}

interface InsightsPanelProps {
  accountId: string;
  initialInsight?: Insight | null;
}

function InsightSection({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  if (!items?.length) return null;
  return (
    <div className="mb-4">
      <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${color}`}>
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace("text-", "bg-")}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatCooldown(until: string): string {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return "";
  const mins = Math.ceil(diff / 60_000);
  return `Available in ${mins} min`;
}

export default function InsightsPanel({
  accountId,
  initialInsight,
}: InsightsPanelProps) {
  const [insight, setInsight] = useState<Insight | null>(initialInsight ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cooldownRemaining =
    insight?.cooldown_until ? formatCooldown(insight.cooldown_until) : "";
  const isOnCooldown = !!cooldownRemaining;

  async function handleGenerate() {
    // Optimistic lock — prevents double-click or button spam before
    // the first network round-trip and DB write completes
    if (isGenerating || isOnCooldown) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to generate insights.");
        return;
      }

      setInsight(json.insight);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#1e2a42] bg-[#0d111a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">AI Insights</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by Gemini · Last 30 trades
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isOnCooldown}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${
              isGenerating || isOnCooldown
                ? "bg-[#1e2a42] text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }
          `}
        >
          {isGenerating
            ? "Generating…"
            : isOnCooldown
            ? cooldownRemaining
            : insight
            ? "Refresh"
            : "Generate"}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {isGenerating && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-3 bg-[#1e2a42] rounded animate-pulse"
              style={{ width: `${70 + i * 7}%` }}
            />
          ))}
        </div>
      )}

      {!isGenerating && insight && (
        <div>
          <InsightSection
            title="Focus areas"
            items={insight.focus_areas}
            color="text-blue-400"
          />
          <InsightSection
            title="Blind spots"
            items={insight.blindspots}
            color="text-orange-400"
          />
          <InsightSection
            title="Observations"
            items={insight.observations}
            color="text-emerald-400"
          />
          <p className="text-xs text-gray-600 mt-3">
            Generated{" "}
            {new Date(insight.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      )}

      {!isGenerating && !insight && !error && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Generate your first AI insight to see patterns in your trading.
          </p>
        </div>
      )}
    </div>
  );
}
