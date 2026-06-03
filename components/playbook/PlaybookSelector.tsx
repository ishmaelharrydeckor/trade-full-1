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
    <div className="rounded-lg p-3" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', backgroundColor: 'var(--app-elevated)' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Playbook</span>
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition", expanded && "rotate-180")} style={{ color: 'var(--text-muted)' }} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {playbooks.map((pb) => (
              <button
                key={pb.id}
                type="button"
                onClick={() => selectPlaybook(pb.id)}
                className="rounded-lg px-3 py-1.5 text-xs transition"
                style={
                  value?.playbookId === pb.id
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }
                    : { borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--app-border)', color: 'var(--text-secondary)' }
                }
              >
                {pb.name}
              </button>
            ))}
          </div>

          {selected && rules.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
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
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition"
                    style={
                      isFollowed
                        ? { backgroundColor: 'color-mix(in srgb, var(--positive) 10%, transparent)', color: 'var(--positive)' }
                        : isBroken
                          ? { backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)', color: 'var(--negative)' }
                          : { color: 'var(--text-secondary)' }
                    }
                  >
                    {isFollowed ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--positive)' }} />
                    ) : isBroken ? (
                      <Square className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--negative)' }} />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span>{rule.text}</span>
                    {isBroken && (
                      <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: 'var(--negative)' }}>broken</span>
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
