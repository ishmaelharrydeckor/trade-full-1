// lib/behavioral-engine.ts
// Programmatic detection of trading psychological biases and compliance stats.

import type { Trade, TradePlaybookEntry, Playbook, JournalEntry } from "@/types/database";
import { tradeNetPnl } from "./stats";

export interface RevengeTradeEvidence {
  triggerTrade: Trade;
  revengeTrade: Trade;
  timeDiffMinutes: number;
  sizeMultiplier: number;
}

export interface OverconfidenceEvidence {
  winningTrade: Trade;
  subsequentTrades: Trade[];
  timeDiffHours: number;
  sizeMultiplier: number;
}

export interface StrategySwitchingEvidence {
  uniquePlaybooksCount: number;
  playbookTradeCounts: Record<string, number>;
  playbooksList: { id: string; name: string; count: number }[];
}

export interface MoodPerformanceCorrelation {
  mood: string;
  tradeCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
}

/**
 * Detects Revenge Trading behavior.
 * Revenge Trading is defined as:
 * - Entering a trade less than 10 minutes after a losing trade (net P&L < 0).
 * - The new trade's size (volume) is larger than the previous losing trade's size (size scaling).
 */
export function detectRevengeTrading(trades: Trade[]): RevengeTradeEvidence[] {
  // Sort trades chronologically by close time (or open time as fallback)
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.close_time ?? a.open_time).getTime();
    const timeB = new Date(b.close_time ?? b.open_time).getTime();
    return timeA - timeB;
  });

  const evidence: RevengeTradeEvidence[] = [];

  for (let i = 1; i < sortedTrades.length; i++) {
    const prev = sortedTrades[i - 1];
    const curr = sortedTrades[i];

    const prevPnl = tradeNetPnl(prev);
    if (prevPnl < 0) {
      const prevCloseTime = prev.close_time ? new Date(prev.close_time).getTime() : null;
      const currOpenTime = new Date(curr.open_time).getTime();

      if (prevCloseTime) {
        const diffMs = currOpenTime - prevCloseTime;
        const diffMins = diffMs / (1000 * 60);

        // Within 10 minutes post-loss and size is scaled up
        if (diffMins > 0 && diffMins <= 10 && curr.volume > prev.volume) {
          evidence.push({
            triggerTrade: prev,
            revengeTrade: curr,
            timeDiffMinutes: Math.round(diffMins * 10) / 10,
            sizeMultiplier: Math.round((curr.volume / prev.volume) * 100) / 100,
          });
        }
      }
    }
  }

  return evidence;
}

/**
 * Detects Overconfidence / Overtrading behavior.
 * Overconfidence is defined as:
 * - Entering a trade within 1 hour after a winning trade (net P&L > 0).
 * - A size or frequency escalation (e.g. volume is larger than recent average, or multiple trades are opened in rapid succession).
 */
export function detectOverconfidence(trades: Trade[]): OverconfidenceEvidence[] {
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.close_time ?? a.open_time).getTime();
    const timeB = new Date(b.close_time ?? b.open_time).getTime();
    return timeA - timeB;
  });

  const evidence: OverconfidenceEvidence[] = [];

  // Calculate moving average volume
  const getRecentAverageVolume = (index: number, count = 5): number => {
    const start = Math.max(0, index - count);
    const slice = sortedTrades.slice(start, index);
    if (slice.length === 0) return 0;
    const sum = slice.reduce((acc, t) => acc + t.volume, 0);
    return sum / slice.length;
  };

  for (let i = 0; i < sortedTrades.length - 1; i++) {
    const winning = sortedTrades[i];
    const winningPnl = tradeNetPnl(winning);

    if (winningPnl > 0) {
      const winningCloseTime = winning.close_time ? new Date(winning.close_time).getTime() : null;
      if (!winningCloseTime) continue;

      const subsequent: Trade[] = [];
      let j = i + 1;

      while (j < sortedTrades.length) {
        const next = sortedTrades[j];
        const nextOpenTime = new Date(next.open_time).getTime();
        const diffMs = nextOpenTime - winningCloseTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Within 1 hour post-win
        if (diffHours > 0 && diffHours <= 1) {
          subsequent.push(next);
        } else {
          break;
        }
        j++;
      }

      if (subsequent.length > 0) {
        const avgVol = getRecentAverageVolume(i);
        const hasSizeEscalation = subsequent.some(s => s.volume > avgVol * 1.2 || s.volume > winning.volume);
        
        if (hasSizeEscalation || subsequent.length >= 2) {
          const maxVol = Math.max(...subsequent.map(s => s.volume));
          evidence.push({
            winningTrade: winning,
            subsequentTrades: subsequent,
            timeDiffHours: Math.round((new Date(subsequent[0].open_time).getTime() - winningCloseTime) / (1000 * 60 * 60) * 10) / 10,
            sizeMultiplier: avgVol > 0 ? Math.round((maxVol / avgVol) * 100) / 100 : 1.0,
          });
        }
      }
    }
  }

  return evidence;
}

/**
 * Computes Plan Adherence percentage.
 * % of trades that are linked to a playbook setup.
 */
export function computePlanAdherence(
  trades: Trade[],
  playbookEntries: TradePlaybookEntry[]
): number {
  if (trades.length === 0) return 100;
  
  const linkedTradeIds = new Set(playbookEntries.map(e => e.trade_id));
  const adheringTrades = trades.filter(t => linkedTradeIds.has(t.id));
  
  return Math.round((adheringTrades.length / trades.length) * 100);
}

/**
 * Detects Strategy Switching behavior.
 * Strategy Switching is defined as:
 * - Jumpiness across multiple playbooks (e.g. trading > 3 distinct playbooks within a short window, with low execution counts per playbook).
 */
export function detectStrategySwitching(
  trades: Trade[],
  playbookEntries: TradePlaybookEntry[],
  playbooks: Playbook[]
): StrategySwitchingEvidence {
  const playbookMap = new Map(playbooks.map(p => [p.id, p.name]));
  const playbookCounts: Record<string, number> = {};

  // Map trade_id to playbook_id
  const tradePlaybookMap = new Map<string, string>();
  for (const entry of playbookEntries) {
    tradePlaybookMap.set(entry.trade_id, entry.playbook_id);
  }

  // Filter trades to last 30 days or recent 30 trades for strategy switching analysis
  const recentTrades = trades.slice(0, 30);

  for (const trade of recentTrades) {
    const playbookId = tradePlaybookMap.get(trade.id);
    if (playbookId) {
      playbookCounts[playbookId] = (playbookCounts[playbookId] || 0) + 1;
    }
  }

  const playbooksList = Object.entries(playbookCounts).map(([id, count]) => ({
    id,
    name: playbookMap.get(id) || "Unknown Strategy",
    count,
  })).sort((a, b) => b.count - a.count);

  return {
    uniquePlaybooksCount: playbooksList.length,
    playbookTradeCounts: playbookCounts,
    playbooksList,
  };
}

/**
 * Computes Mood vs. Performance metrics.
 * Correlates emotional/mood tags from daily journals with trade performance.
 */
export function computeMoodPerformance(
  trades: Trade[],
  journalEntries: JournalEntry[]
): MoodPerformanceCorrelation[] {
  // Map date (YYYY-MM-DD) to mood state
  const journalMoodMap = new Map<string, string>();
  for (const entry of journalEntries) {
    if (entry.mental_state) {
      const dateStr = entry.entry_date.split("T")[0];
      journalMoodMap.set(dateStr, entry.mental_state.toLowerCase().trim());
    }
  }

  const moodGroups: Record<string, { trades: Trade[]; netPnl: number; wins: number; losses: number; grossProfit: number; grossLoss: number }> = {};

  for (const trade of trades) {
    const tradeDateStr = new Date(trade.close_time ?? trade.open_time).toISOString().split("T")[0];
    // Check if daily journal exists for that day, or fallback to trade mindset
    let mood = journalMoodMap.get(tradeDateStr);
    
    if (!mood && trade.mindset) {
      mood = trade.mindset.toLowerCase().trim();
    }

    if (!mood) {
      mood = "unspecified";
    }

    if (!moodGroups[mood]) {
      moodGroups[mood] = { trades: [], netPnl: 0, wins: 0, losses: 0, grossProfit: 0, grossLoss: 0 };
    }

    const group = moodGroups[mood];
    group.trades.push(trade);
    const pnl = tradeNetPnl(trade);
    group.netPnl += pnl;

    if (pnl > 0) {
      group.wins++;
      group.grossProfit += pnl;
    } else if (pnl < 0) {
      group.losses++;
      group.grossLoss += pnl;
    }
  }

  return Object.entries(moodGroups).map(([mood, data]) => {
    const total = data.trades.length;
    const winRate = total > 0 ? (data.wins / total) * 100 : 0;
    const profitFactor = data.grossLoss !== 0 ? data.grossProfit / Math.abs(data.grossLoss) : (data.grossProfit > 0 ? Infinity : 0);

    return {
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      tradeCount: total,
      winRate: Math.round(winRate * 10) / 10,
      netPnl: Math.round(data.netPnl * 100) / 100,
      profitFactor: profitFactor === Infinity ? 99.9 : Math.round(profitFactor * 100) / 100,
    };
  }).sort((a, b) => b.tradeCount - a.tradeCount);
}
