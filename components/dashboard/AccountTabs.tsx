// components/dashboard/AccountTabs.tsx
"use client";

import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  LayoutDashboard,
  ListChecks,
  LineChart,
  Calendar,
  Wallet,
  BookOpen,
  BookText,
  Target,
} from "lucide-react";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    tooltip: "Your trading dashboard at a glance — KPIs, equity curve, drawdown chart, and AI-powered insights.",
  },
  {
    id: "trades",
    label: "Trades",
    icon: ListChecks,
    tooltip: "View, filter, and manage all your trades. Add new trades manually or import via CSV.",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: LineChart,
    tooltip: "Deep-dive into your performance — breakdown by symbol, day of week, hour, session, and more.",
  },
  {
    id: "playbook",
    label: "Playbook",
    icon: BookOpen,
    tooltip: "Define your trading strategies with rules and checklists. Track which playbooks perform best.",
  },
  {
    id: "notebook",
    label: "Notebook",
    icon: BookText,
    tooltip: "Daily session planner — write your pre-session plan, review your trades, and capture lessons learned.",
  },
  {
    id: "progress",
    label: "Progress",
    icon: Target,
    tooltip: "Track your daily trading discipline with custom habit checklists, streaks, and a discipline heatmap.",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    tooltip: "See your trading P&L on a calendar. Quickly spot your best and worst days at a glance.",
  },
  {
    id: "account",
    label: "Account",
    icon: Wallet,
    tooltip: "Manage account settings — deposits, withdrawals, starting balance, and broker configuration.",
  },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function AccountTabs({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <div className="relative -mx-4 md:mx-0">
      <div className="overflow-x-auto px-4 md:px-0">
        <nav className="inline-flex shrink-0 gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur">
          {TABS.map((t) => {
            const isActive = t.id === active;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <InfoTooltip
                  text={t.tooltip}
                  className={isActive ? "[&_svg]:text-slate-400" : ""}
                />
              </button>
            );
          })}
        </nav>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--bg-app)] to-transparent md:hidden" />
    </div>
  );
}
