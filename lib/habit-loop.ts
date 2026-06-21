// lib/habit-loop.ts
// Computes streaks, badges, rings, longitudinal insights, and personal trading profile from session audits and trades.

import type { Trade, SessionAudit } from "@/types/database";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  progress?: number; // e.g. 15 / 30
  target?: number;
}

export interface DisciplineRingsData {
  ruleCompliance: number;   // 0 - 100
  emotionalAwareness: number; // 0 - 100
  consistency: number;        // 0 - 100 (current streak / target of 7 days)
}

export interface PatternInsight {
  type: "warning" | "positive" | "neutral";
  text: string;
}

export interface TraderProfile {
  strengths: string[];
  weaknesses: string[];
}

/**
 * Calculates current and longest streaks based on completed audits.
 * An audit counts for a day if its date is present.
 */
export function calculateStreaks(audits: SessionAudit[]): StreakInfo {
  if (audits.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Sort dates descending to calculate current streak
  const auditDates = Array.from(new Set(audits.map(a => a.audit_date.split("T")[0])))
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today or yesterday is the start of the current streak
  const firstAuditDate = auditDates[0];
  const diffTimeToday = Math.abs(today.getTime() - firstAuditDate.getTime());
  const diffDaysToday = Math.ceil(diffTimeToday / (1000 * 60 * 60 * 24));

  // If latest audit was more than 1 day ago (ignoring timezone issues slightly), current streak is broken/0
  if (diffDaysToday > 1) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    let expectedTime = firstAuditDate.getTime();
    for (let i = 1; i < auditDates.length; i++) {
      expectedTime -= 24 * 60 * 60 * 1000; // subtract 1 day
      const checkDate = auditDates[i].getTime();
      
      // Allow timezone flexibility: if it matches the expected day (approx)
      if (Math.abs(checkDate - expectedTime) < 12 * 60 * 60 * 1000) {
        currentStreak++;
        expectedTime = checkDate; // update reference
      } else {
        break;
      }
    }
  }

  // Calculate longest streak chronologically ascending
  const ascDates = [...auditDates].sort((a, b) => a.getTime() - b.getTime());
  if (ascDates.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < ascDates.length; i++) {
      const diff = ascDates[i].getTime() - ascDates[i - 1].getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Computes discipline rings data.
 */
export function computeDisciplineRings(
  audits: SessionAudit[],
  trades: Trade[]
): DisciplineRingsData {
  if (audits.length === 0) {
    return { ruleCompliance: 0, emotionalAwareness: 0, consistency: 0 };
  }

  // 1. Rule Compliance: Average execution checklist score of all audits
  const scoreSum = audits.reduce((sum, a) => sum + a.execution_score, 0);
  const ruleCompliance = Math.round(scoreSum / audits.length);

  // 2. Emotional Awareness: % of trading days with emotional reflections logged
  // Identify unique trading days
  const tradingDays = Array.from(new Set(trades.map(t => new Date(t.close_time ?? t.open_time).toISOString().split("T")[0])));
  const auditDays = new Set(audits.map(a => a.audit_date.split("T")[0]));
  
  const totalTradingDays = tradingDays.length || 1;
  const reflectiveTradingDays = tradingDays.filter(day => auditDays.has(day)).length;
  const emotionalAwareness = Math.round((reflectiveTradingDays / totalTradingDays) * 100);

  // 3. Consistency: Current streak relative to a target of 7 days
  const { currentStreak } = calculateStreaks(audits);
  const consistency = Math.min(Math.round((currentStreak / 7) * 100), 100);

  return { ruleCompliance, emotionalAwareness, consistency };
}

/**
 * Evaluates earned badges.
 */
export function evaluateBadges(audits: SessionAudit[]): Badge[] {
  const { longestStreak } = calculateStreaks(audits);

  const totalAudits = audits.length;
  const compliantDaysCount = audits.filter(a => a.execution_score >= 80).length;
  const riskRespectedDaysCount = audits.filter(a => a.respected_risk).length;

  return [
    {
      id: "rule_follower",
      name: "Rule Follower",
      description: "Completed 7 compliant session audits (score >= 80%).",
      earned: compliantDaysCount >= 7,
      progress: Math.min(compliantDaysCount, 7),
      target: 7,
    },
    {
      id: "risk_guardian",
      name: "Risk Guardian",
      description: "Respected risk limits for 30 session audits.",
      earned: riskRespectedDaysCount >= 30,
      progress: Math.min(riskRespectedDaysCount, 30),
      target: 30,
    },
    {
      id: "emotion_tracker",
      name: "Emotion Tracker",
      description: "Log emotions across 30 completed reflections.",
      earned: totalAudits >= 30,
      progress: Math.min(totalAudits, 30),
      target: 30,
    },
    {
      id: "consistency_builder",
      name: "Consistency Builder",
      description: "Reach a 14-day consecutive audit streak.",
      earned: longestStreak >= 14,
      progress: Math.min(longestStreak, 14),
      target: 14,
    },
  ];
}

/**
 * Computes longitudinal analysis pattern insights.
 */
export function generateLongitudinalInsights(
  audits: SessionAudit[],
  trades: Trade[]
): PatternInsight[] {
  const insights: PatternInsight[] = [];
  if (audits.length === 0) return insights;

  // Insight 1: Rule violations after consecutive losses
  // Sort trades chronologically
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(a.close_time ?? a.open_time).getTime() - new Date(b.close_time ?? b.open_time).getTime();
  });

  let lossStreakCount = 0;
  let auditsPostLossStreak: SessionAudit[] = [];
  
  // Find audits matching days after a 2-loss streak
  const auditDateMap = new Map(audits.map(a => [a.audit_date.split("T")[0], a]));

  for (let i = 1; i < sortedTrades.length; i++) {
    const prev = sortedTrades[i - 1];
    const curr = sortedTrades[i];
    const prevPnl = (prev.pnl ?? 0) - (prev.commission ?? 0) - (prev.swap ?? 0);
    const currPnl = (curr.pnl ?? 0) - (curr.commission ?? 0) - (curr.swap ?? 0);

    if (prevPnl < 0 && currPnl < 0) {
      const nextDayStr = new Date(new Date(curr.close_time ?? curr.open_time).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const matchingAudit = auditDateMap.get(nextDayStr);
      if (matchingAudit) {
        auditsPostLossStreak.push(matchingAudit);
      }
    }
  }

  if (auditsPostLossStreak.length >= 3) {
    const violationsPostLoss = auditsPostLossStreak.filter(a => a.execution_score < 100).length;
    const violationRate = Math.round((violationsPostLoss / auditsPostLossStreak.length) * 100);
    if (violationRate > 25) {
      insights.push({
        type: "warning",
        text: `You are ${violationRate}% more likely to violate checklist rules after 2 consecutive losses.`,
      });
    }
  } else {
    // Default fallback check from general statistics
    insights.push({
      type: "neutral",
      text: "Establish a 2-week history of session reviews to unlock precise rules-deviation patterns.",
    });
  }

  // Insight 2: Friday average execution score drop
  const fridayAudits = audits.filter(a => new Date(a.audit_date).getDay() === 5);
  const otherAudits = audits.filter(a => new Date(a.audit_date).getDay() !== 5);

  if (fridayAudits.length >= 3 && otherAudits.length >= 3) {
    const fridayAvg = fridayAudits.reduce((sum, a) => sum + a.execution_score, 0) / fridayAudits.length;
    const otherAvg = otherAudits.reduce((sum, a) => sum + a.execution_score, 0) / otherAudits.length;
    const diff = otherAvg - fridayAvg;

    if (diff > 5) {
      insights.push({
        type: "warning",
        text: `Your process execution score drops by average of ${Math.round(diff)}% on Fridays.`,
      });
    }
  }

  // Insight 3: FOMO / Emotional triggers
  const fomoAudits = audits.filter(a => a.emotional_states.some(s => s.toLowerCase() === "fomo"));
  const nonFomoAudits = audits.filter(a => !a.emotional_states.some(s => s.toLowerCase() === "fomo"));

  if (fomoAudits.length >= 2) {
    const fomoViolations = fomoAudits.filter(a => !a.waited_setup).length;
    const fomoViolationRate = Math.round((fomoViolations / fomoAudits.length) * 100);
    if (fomoViolationRate > 30) {
      insights.push({
        type: "warning",
        text: `FOMO emotions trigger rule deviations (${fomoViolationRate}% of the time you skip waiting for setups).`,
      });
    }
  }

  // Insight 4: Positive anchor
  const patientAudits = audits.filter(a => a.emotional_states.some(s => s.toLowerCase() === "patient"));
  if (patientAudits.length >= 3) {
    const patientAvg = patientAudits.reduce((sum, a) => sum + a.execution_score, 0) / patientAudits.length;
    if (patientAvg >= 90) {
      insights.push({
        type: "positive",
        text: `Excellent compliance (${Math.round(patientAvg)}% score) observed when emotional state is marked "Patient".`,
      });
    }
  }

  return insights;
}

/**
 * Computes Trader Strengths and Weaknesses.
 */
export function generateTraderProfile(audits: SessionAudit[]): TraderProfile {
  if (audits.length === 0) {
    return {
      strengths: ["Reflective tracking starting"],
      weaknesses: ["Pending audit logs"],
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const total = audits.length;

  const planRatio = audits.filter(a => a.followed_plan).length / total;
  const riskRatio = audits.filter(a => a.respected_risk).length / total;
  const revengeRatio = audits.filter(a => a.avoided_revenge).length / total;
  const setupRatio = audits.filter(a => a.waited_setup).length / total;
  const stopLossRatio = audits.filter(a => a.respected_sl).length / total;

  // Evaluate Strengths
  if (riskRatio >= 0.85) strengths.push("Risk Management (Respects predetermined risk bounds)");
  if (planRatio >= 0.85) strengths.push("Plan Fidelity (Consistently executes the stated playbook)");
  if (revengeRatio >= 0.9) strengths.push("Patience (Avoids tilt/revenge scaling post-loss)");
  if (stopLossRatio >= 0.9) strengths.push("Execution Safeguards (Never widens or ignores stop losses)");
  if (setupRatio >= 0.85) strengths.push("Setup Discipline (Waits diligently for playbook parameters)");

  if (strengths.length === 0) {
    strengths.push("Reflective Onboarding (Engaged in the habit-loop reviews)");
  }

  // Evaluate Weaknesses
  if (riskRatio < 0.7) weaknesses.push("Risk Discipline (Prone to violating predetermined risk thresholds)");
  if (planRatio < 0.7) weaknesses.push("Plan Deviations (Prone to trading impulsive off-plan setups)");
  if (revengeRatio < 0.8) weaknesses.push("Post-Loss Revenge (Prone to size scaling or rapid entries post-loss)");
  if (stopLossRatio < 0.8) weaknesses.push("Emotional Stop Adjustments (Altering stop losses in-session)");
  if (setupRatio < 0.7) weaknesses.push("FOMO / Impulse Entries (Failing to wait for playbook verification)");

  if (weaknesses.length === 0) {
    weaknesses.push("None identified yet (Maintain compliance above thresholds!)");
  }

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) };
}
