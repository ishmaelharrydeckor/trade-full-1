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
import PositionCalculator from "@/components/account/PositionCalculator";
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
  const startingBalance = account.starting_balance ?? 0;
  const riskParts = settings?.risk_parts ?? 10;
  const currentEquity = useMemo(
    () => computeCurrentEquity(trades, transactions, startingBalance),
    [trades, transactions, startingBalance]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <EaDownloadPanel
        accountId={account.id}
        accountName={account.name}
        eaToken={account.ea_token}
      />
      <ConnectionPanel account={account} />
      <RiskSettingsPanel
        accountId={account.id}
        initialParts={riskParts}
        onSaved={() => router.refresh()}
      />
      <PositionCalculator
        equity={currentEquity}
        riskParts={riskParts}
        currency={account.currency}
      />
      <div className="lg:col-span-2">
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
// EA Token + Connect MT5 panel
// ============================================================
function ConnectionPanel({ account }: { account: Account }) {
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(account.ea_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const downloadUrl = `/api/ea/download?accountId=${account.id}`;

  return (
    <div className="rounded-xl p-5 lg:col-span-2" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-lg font-bold">Connect MT5 — live sync</h3>
      </div>
      <p className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Download our expert advisor, drop it on any MT5 chart, and every
        closed trade plus open position will sync here automatically.
      </p>

      {/* Download CTA */}
      <a
        href={downloadUrl}
        download
        className="tj-btn-primary mb-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm shadow-lg"
      >
        <Download className="h-4 w-4" />
        Download EA (.mq5)
      </a>

      {/* Token block (collapsible, in case people want to copy manually) */}
      <details className="rounded-lg p-3" style={{ border: '1px solid var(--app-border)', background: 'var(--app-elevated)' }}>
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Or copy the token manually
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 break-all font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            {account.ea_token}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="tj-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Keep this private — anyone with the token can push trades to this account.
        </p>
      </details>

      {/* Setup instructions */}
      <details
        className="mt-4 rounded-lg border p-3"
        style={{
          borderColor: "rgba(217, 119, 6, 0.25)",
          backgroundColor: "rgba(217, 119, 6, 0.04)",
        }}
        open
      >
        <summary
          className="cursor-pointer text-sm font-bold"
          style={{ color: "var(--accent-warm)" }}
        >
          Setup steps (one time, ~3 minutes)
        </summary>
        <ol
          className="mt-3 space-y-2.5 pl-4 text-xs list-decimal"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>
            <strong>Whitelist this app in MT5.</strong> In MetaTrader 5:{" "}
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--accent-warm)" }}
            >
              Tools → Options → Expert Advisors
            </span>
            . Tick
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--accent-warm)" }}
            >
              {" "}
              "Allow WebRequest for listed URL"
            </span>{" "}
            and add:
            <code
              className="mt-1 block break-all rounded px-2 py-1 font-mono text-[11px]"
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--app-border)",
              }}
            >
              {typeof window !== "undefined"
                ? window.location.origin
                : "https://trade-full-1.vercel.app"}
            </code>
          </li>
          <li>
            <strong>Place the file.</strong> In MT5:{" "}
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--accent-warm)" }}
            >
              File → Open Data Folder → MQL5 → Experts
            </span>
            . Drop the downloaded{" "}
            <code
              className="font-mono"
              style={{ color: "var(--accent-warm)" }}
            >
              .mq5
            </code>{" "}
            file in there.
          </li>
          <li>
            <strong>Compile it.</strong> Open{" "}
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--accent-warm)" }}
            >
              MetaEditor
            </span>{" "}
            (press{" "}
            <kbd
              className="rounded px-1 font-mono text-[10px]"
              style={{
                backgroundColor: "var(--app-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--app-border)",
              }}
            >
              F4
            </kbd>{" "}
            from MT5, or double-click the{" "}
            <code
              className="font-mono"
              style={{ color: "var(--accent-warm)" }}
            >
              .mq5
            </code>{" "}
            file in Experts folder). Then press{" "}
            <kbd
              className="rounded px-1 font-mono text-[10px]"
              style={{
                backgroundColor: "var(--app-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--app-border)",
              }}
            >
              F7
            </kbd>{" "}
            to compile. You should see{" "}
            <span className="font-mono text-[11px] text-emerald-500 font-semibold">
              "0 errors, 0 warnings"
            </span>{" "}
            at the bottom. This step is what makes the EA appear in MT5's
            Navigator.
          </li>
          <li>
            <strong>Refresh the Navigator</strong> in MT5 (press{" "}
            <kbd
              className="rounded px-1 font-mono text-[10px]"
              style={{
                backgroundColor: "var(--app-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--app-border)",
              }}
            >
              F5
            </kbd>{" "}
            or right-click Expert Advisors → Refresh).
          </li>
          <li>
            <strong>Drag it onto any chart.</strong> Look for{" "}
            <code
              className="font-mono"
              style={{ color: "var(--accent-warm)" }}
            >
              TradeFull1_
              {account.name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40)}
            </code>{" "}
            under Expert Advisors (the name matches your downloaded filename).
            Drop it on any chart — the symbol doesn't matter, the EA monitors
            the whole account. In the dialog, check{" "}
            <strong>Allow algorithmic trading</strong> → <strong>OK</strong>.
          </li>
          <li>
            <strong>Look for the smiley face</strong> 🙂 in the top-right of the
            chart — that means the EA is running. The{" "}
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--accent-warm)" }}
            >
              Experts
            </span>{" "}
            tab at the bottom of MT5 should show{" "}
            <span className="font-mono text-[11px] text-emerald-500 font-semibold">
              "TradeFull1Sync online. Account #..."
            </span>
            . Place a trade, close it, and watch the dashboard light up within
            ~10 seconds.
          </li>
        </ol>
      </details>
    </div>
  );
}

// ============================================================
// Risk strategy parts panel
// ============================================================
function RiskSettingsPanel({
  accountId,
  initialParts,
  onSaved,
}: {
  accountId: string;
  initialParts: number;
  onSaved: () => void;
}) {
  const [parts, setParts] = useState<number>(initialParts);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    // Upsert: insert if missing, update if present
    const { error } = await supabase
      .from("account_settings")
      .upsert(
        {
          user_id: user.id,
          account_id: accountId,
          risk_parts: parts,
        },
        { onConflict: "account_id" }
      );

    setSaving(false);
    if (!error) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
      onSaved();
    }
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color: 'var(--warning)' }} />
        <h3 className="text-lg font-bold">Risk strategy</h3>
      </div>
      <p className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        How many equal parts do you divide your account into per trade? A
        10-part strategy means each trade risks 1/10 of your current equity.
        The position calculator (coming in M2.3) uses this.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={100}
          value={parts}
          onChange={(e) => setParts(Number(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <input
          type="number"
          min={1}
          max={100}
          value={parts}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) setParts(Math.max(1, Math.min(100, v)));
          }}
          className="tj-input w-16 text-center text-sm tabular-nums"
        />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>parts</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Each trade risks ≈{" "}
          <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(100 / parts).toFixed(1)}%</span>{" "}
          of equity
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving || parts === initialParts}
          className="tj-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          {savedAt ? "Saved ✓" : saving ? "Saving" : "Save"}
        </button>
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
