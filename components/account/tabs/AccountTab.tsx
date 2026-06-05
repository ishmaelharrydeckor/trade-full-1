// components/account/tabs/AccountTab.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Loader2,
  Download,
} from "lucide-react";
import type {
  Account,
  AccountTransaction,
  AccountSettings,
  Trade,
} from "@/types/database";
import { fmtSignedUsd, fmtDate } from "@/lib/format";
import { computeCurrentEquity } from "@/lib/stats";
import EaDownloadPanel from "@/components/account/EaDownloadPanel";
import { cn } from "@/lib/utils";

export default function AccountTab({
  account,
  trades,
  transactions,
  settings,
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
  settings: AccountSettings | null;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-6">
      <EaDownloadPanel
        accountId={account.id}
        accountName={account.name}
        eaToken={account.ea_token}
      />
      <div>
        <TransactionsPanel
          accountId={account.id}
          currency={account.currency}
          transactions={transactions}
          onChanged={() => router.refresh()}
        />
      </div>
    </div>
  );
}





// ============================================================
// Deposits / Withdrawals
// ============================================================
function TransactionsPanel({
  accountId,
  currency,
  transactions,
  onChanged,
}: {
  accountId: string;
  currency: string;
  transactions: AccountTransaction[];
  onChanged: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("account_transactions").insert({
      user_id: user.id,
      account_id: accountId,
      type,
      amount: Number(amount),
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!error) {
      setAmount("");
      setNotes("");
      setAddOpen(false);
      onChanged();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const supabase = createClient();
    await supabase.from("account_transactions").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Deposits & withdrawals</h3>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="tj-btn-secondary px-3 py-1 text-xs"
        >
          {addOpen ? "Cancel" : "Add"}
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleAdd}
          className="mb-4 grid grid-cols-1 gap-3 rounded-xl p-3 md:grid-cols-5" style={{ border: '1px solid var(--app-border)', background: 'var(--app-elevated)' }}
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "deposit" | "withdrawal")}
            className="tj-input text-sm"
          >
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tj-input text-sm"
          />
          <input
            type="datetime-local"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="tj-input text-sm"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="tj-input text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="tj-btn-primary inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? "…" : "Save"}
          </button>
        </form>
      )}

      {transactions.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-sm font-medium" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          No transactions yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--app-border)' }}>
          <table className="tj-table w-full min-w-[500px] text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit";
                return (
                  <tr key={tx.id} style={{ color: 'var(--text-primary)' }}>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          isDeposit
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-amber-500/10 text-amber-300"
                        )}
                      >
                        {isDeposit ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2 text-right font-bold tabular-nums"
                      style={{ color: isDeposit ? 'var(--positive)' : 'var(--warning)' }}
                    >
                      {isDeposit ? "+" : "-"}
                      {currency} {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(tx.occurred_at)}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {tx.notes ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        className="rounded-md p-1 transition duration-150 hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
