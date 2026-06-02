"use client";

import PlaybookManager from "@/components/playbook/PlaybookManager";
import PlaybookAnalytics from "@/components/playbook/PlaybookAnalytics";
import type { Account, Trade, Playbook, TradePlaybookEntry } from "@/types/database";

export default function PlaybookTab({
  account,
  trades,
  playbooks,
  entries,
}: {
  account: Account;
  trades: Trade[];
  playbooks: Playbook[];
  entries: TradePlaybookEntry[];
}) {
  return (
    <div className="space-y-8">
      <PlaybookManager accountId={account.id} playbooks={playbooks} />
      <PlaybookAnalytics playbooks={playbooks} trades={trades} entries={entries} />
    </div>
  );
}
