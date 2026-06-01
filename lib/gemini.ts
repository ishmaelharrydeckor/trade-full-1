// lib/gemini.ts
// Wraps the Google Gemini API call for generating trading insights.
// Uses gemini-2.5-flash (cheap, fast). The model returns JSON conforming to
// our response schema; we still defensively parse + strip code fences.

import type { Trade } from "@/types/database";
import { tradeNetPnl, computeKpis } from "./stats";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface InsightResult {
  observations: string[];
  blindspots: string[];
  discipline_notes: string;
}

export async function generateInsights({
  trades,
  riskParts,
  apiKey,
}: {
  trades: Trade[];
  riskParts: number;
  apiKey: string;
}): Promise<InsightResult> {
  const recent = trades.slice(0, 30); // most-recent 30 trades, already sorted DESC

  // Compose a compact stats summary
  const kpis = computeKpis(recent);
  const totalTrades = recent.length;

  // Compose a per-trade summary the model can reason over
  const tradeLines = recent.map((t, i) => {
    const net = tradeNetPnl(t);
    return `${i + 1}. ${t.symbol} ${t.direction.toUpperCase()} ${Number(t.volume).toFixed(2)} lots · P&L ${net >= 0 ? "+" : ""}${net.toFixed(2)} · ${t.mindset ?? "no mindset"} · tags: [${(t.tags ?? []).join(", ")}] · ${t.notes ? `notes: "${t.notes.slice(0, 100)}"` : "no notes"}`;
  });

  const prompt = `You are a sharp, honest trading coach. Analyze this trader's recent ${totalTrades} closed trades. Be specific, cite numbers, avoid generic platitudes.

SUMMARY STATS:
- Total trades: ${kpis.trades}
- Win rate: ${kpis.winRate.toFixed(1)}%
- Net P&L: ${kpis.netPnl >= 0 ? "+" : ""}$${kpis.netPnl.toFixed(2)}
- Profit factor: ${kpis.profitFactor === Infinity ? "∞" : kpis.profitFactor.toFixed(2)}
- Avg winner: $${kpis.avgWinner.toFixed(2)} · Avg loser: $${kpis.avgLoser.toFixed(2)}
- Best streak: ${kpis.bestStreak}W · Worst streak: ${kpis.worstStreak}L
- Risk strategy: ${riskParts}-part (each trade risks ~${(100 / riskParts).toFixed(1)}% of equity)

TRADES (newest first):
${tradeLines.join("\n")}

Provide:
1. observations: 3-5 specific positive patterns you see (numbers, symbols, mindsets that work)
2. blindspots: 2-4 specific concerning patterns (revenge trades, bad pairings, oversized losses)
3. discipline_notes: ONE sentence — the single most important thing they should focus on this week

Be honest. If profit factor is below 1 or win rate is under 40%, say so directly. If they're doing well, name specifically what's working.`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          observations: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
          },
          blindspots: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
          discipline_notes: { type: "string" },
        },
        required: ["observations", "blindspots", "discipline_notes"],
      },
    },
  };

  const url = `${ENDPOINT}?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty response from Gemini");

  // Defensive parse: Gemini sometimes wraps JSON in ```json fences even when
  // responseMimeType says otherwise.
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed: InsightResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last-resort: extract first { ... } block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse Gemini JSON response");
    parsed = JSON.parse(match[0]);
  }

  // Validate shape
  if (
    !Array.isArray(parsed.observations) ||
    !Array.isArray(parsed.blindspots) ||
    typeof parsed.discipline_notes !== "string"
  ) {
    throw new Error("Gemini response missing required fields");
  }

  return parsed;
}
