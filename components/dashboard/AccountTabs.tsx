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
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "trades",    label: "Trades",    icon: ListChecks },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "playbook",  label: "Playbook",  icon: BookOpen },
  { id: "notebook",  label: "Notebook",  icon: BookText },
  { id: "progress",  label: "Progress",  icon: Target },
  { id: "calendar",  label: "Calendar",  icon: Calendar },
  { id: "account",   label: "Account",   icon: Wallet },
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
              </button>
            );
          })}
        </nav>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--bg-app)] to-transparent md:hidden" />
    </div>
  );
}
