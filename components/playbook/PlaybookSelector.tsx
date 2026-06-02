"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, CheckSquare, Square } from "lucide-react";
import type { Playbook, PlaybookRule } from "@/types/database";
import { cn } from "@/lib/utils";

export interface PlaybookSelection {
  playbookId: string;
  rulesFollowed: string[];
  rulesBroken: string[];
}

export default function PlaybookSelector({
  playbooks,
  value,
  onChange,
}: {
  playbooks: Playbook[];
  value: PlaybookSelection | null;
  onChange: (selection: PlaybookSelection | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (playbooks.length === 0) return null;

  const selected = value ? playbooks.find((p) => p.id === value.playbookId) : null;
  const rules = selected ? (selected.rules as PlaybookRule[]) : [];

  function selectPlaybook(playbookId: string) {
    if (value?.playbookId === playbookId) {
      onChange(null);
    } else {
      onChange({ playbookId, rulesFollowed: [], rulesBroken: [] });
    }
    setExpanded(true);
  }

  function toggleRule(ruleId: string) {
    if (!value) return;
    const isFollowed = value.rulesFollowed.includes(ruleId);
    const isBroken = value.rulesBroken.includes(ruleId);

    if (!isFollowed && !isBroken) {
      // First click: mark as followed
      onChange({ ...value, rulesFollowed: [...value.rulesFollowed, ruleId] });
    } else if (isFollowed) {
      // Second click: mark as broken
      onChange({
        ...value,
        rulesFollowed: value.rulesFollowed.filter((id) => id !== ruleId),
        rulesBroken: [...value.rulesBroken, ruleId],
      });
    } else {
      // Third click: unmark
      onChange({
        ...value,
        rulesBroken: value.rulesBroken.filter((id) => id !== ruleId),
      });
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        <BookOpen className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-xs uppercase tracking-wider text-slate-400">Playbook</span>
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 text-slate-500 transition", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {playbooks.map((pb) => (
              <button
                key={pb.id}
                type="button"
                onClick={() => selectPlaybook(pb.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs transition",
                  value?.playbookId === pb.id
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "border border-white/10 text-slate-300 hover:bg-white/5"
                )}
              >
                {pb.name}
              </button>
            ))}
          </div>

          {selected && rules.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Check rules you followed (click again to mark as broken)
              </p>
              {rules.map((rule) => {
                const isFollowed = value?.rulesFollowed.includes(rule.id);
                const isBroken = value?.rulesBroken.includes(rule.id);
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
                      isFollowed
                        ? "bg-emerald-500/10 text-emerald-300"
                        : isBroken
                          ? "bg-red-500/10 text-red-300"
                          : "text-slate-400 hover:bg-white/5"
                    )}
                  >
                    {isFollowed ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : isBroken ? (
                      <Square className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    )}
                    <span>{rule.text}</span>
                    {isBroken && (
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-red-400">broken</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
