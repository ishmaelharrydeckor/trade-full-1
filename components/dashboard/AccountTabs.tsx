// components/dashboard/AccountTabs.tsx
"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  ListChecks,
  LineChart,
  Calendar,
  Wallet,
  BookOpen,
  BookText,
  Target,
  ChevronLeft,
  ChevronRight,
  Calculator,
} from "lucide-react";

export const SIDEBAR_GROUPS = [
  {
    label: "Performance",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        tooltip: "Quick account health snapshot — Balance, P&L, win rate, and equity curves.",
        priority: "high",
      },
      {
        id: "trades",
        label: "Trades",
        icon: ListChecks,
        tooltip: "Trade-level execution analysis, history log, filterable grid, and tag manager.",
        priority: "high",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: LineChart,
        tooltip: "Deep capital reporting, symbol statistics, and hourly session analytics.",
        priority: "high",
      },
    ] as const,
  },
  {
    label: "Improvement",
    items: [
      {
        id: "insights",
        label: "AI Coach",
        icon: Sparkles,
        tooltip: "AI behavioral pattern detection, mistake trackers, and strategic execution tips.",
        priority: "high",
      },
      {
        id: "notebook",
        label: "Journal",
        icon: BookText,
        tooltip: "Distraction-free structured reflection workspace with auto-saves and emotional tags.",
        priority: "high",
      },
      {
        id: "progress",
        label: "Discipline",
        icon: Target,
        tooltip: "Consistency stats, habit checks, streak counts, and behavioral rules followed.",
        priority: "medium",
      },
    ] as const,
  },
  {
    label: "Planning",
    items: [
      {
        id: "playbook",
        label: "Playbook",
        icon: BookOpen,
        tooltip: "Custom strategy checklists, entry parameters, exit rules, and template configurations.",
        priority: "medium",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: Calendar,
        tooltip: "Capital heatmaps, trade logs, and daily execution consistency records.",
        priority: "medium",
      },
    ] as const,
  },
  {
    label: "Tools",
    items: [
      {
        id: "calculator",
        label: "Risk Calculator",
        icon: Calculator,
        tooltip: "Real-time lot sizing calculator, R:R models, and exposure threshold warnings.",
        priority: "low",
      },
    ] as const,
  },
  {
    label: "Settings",
    items: [
      {
        id: "account",
        label: "Account Settings",
        icon: Wallet,
        tooltip: "Broker properties, starting balances, EA connection metrics, and archiving controls.",
        priority: "low",
      },
    ] as const,
  },
] as const;

export type TabId = "overview" | "insights" | "trades" | "analytics" | "playbook" | "notebook" | "progress" | "calendar" | "calculator" | "account";

export default function AccountTabs({
  active,
  onSelect,
  isCollapsed,
  onToggleCollapse,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <nav
      className={cn(
        "flex flex-row lg:flex-col gap-3 w-full overflow-x-auto lg:overflow-x-visible p-3 rounded-xl border backdrop-blur shrink-0 transition-all duration-300",
        isCollapsed ? "lg:w-16" : "lg:w-60"
      )}
      style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
    >
      {/* Collapse Toggle Button (Desktop Only) */}
      <div className="hidden lg:block border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full rounded-lg py-2 text-[color:var(--text-secondary)] hover:bg-white/5 transition-colors duration-150"
          title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ChevronLeft className="h-4 w-4" />
              <span>Minimize</span>
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-row lg:flex-col gap-4 w-full">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-row lg:flex-col gap-1 w-full">
            {/* Group Label */}
            {!isCollapsed && (
              <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] px-3 mb-1 mt-2">
                {group.label}
              </span>
            )}
            
            <div className="flex flex-row lg:flex-col gap-1 w-full">
              {group.items.map((item) => {
                const isActive = item.id === active;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    title={isCollapsed ? item.label : item.tooltip}
                    className={cn(
                      "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 w-auto lg:w-full text-left justify-start hover:bg-white/5",
                      isActive 
                        ? "font-bold text-white" 
                        : item.priority === "high" 
                          ? "text-[color:var(--text-primary)]" 
                          : item.priority === "medium"
                            ? "text-[color:var(--text-secondary)]"
                            : "text-[color:var(--text-muted)] opacity-80 hover:opacity-100",
                      isCollapsed && "lg:justify-center lg:px-0 lg:py-3"
                    )}
                    style={isActive ? { backgroundColor: "var(--accent)" } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className={cn("transition-opacity duration-200", isCollapsed && "lg:hidden")}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
