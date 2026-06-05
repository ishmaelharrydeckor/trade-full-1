// components/dashboard/AccountTabs.tsx
"use client";

import { cn } from "@/lib/utils";
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
    tooltip: "See your trading P&L on a calendar. Click any day to log trades or write journal entries.",
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
    <nav className="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto lg:overflow-x-visible p-1.5 rounded-xl border backdrop-blur shrink-0"
         style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
      {TABS.map((t) => {
        const isActive = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            title={t.tooltip}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-150 w-auto lg:w-full text-left justify-start hover:bg-white/5",
              isActive
                ? "font-bold text-white"
                : "text-[color:var(--text-secondary)]"
            )}
            style={isActive
              ? { backgroundColor: 'var(--accent)' }
              : undefined
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
