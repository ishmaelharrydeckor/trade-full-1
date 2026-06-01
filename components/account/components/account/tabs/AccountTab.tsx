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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur lg:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-400" />
        <h3 className="font-serif text-lg">Connect MT5 — live sync</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Download our expert advisor, drop it on any MT5 chart, and every
        closed trade plus open position will sync here automatically.
      </p>

      {/* Download CTA */}
      <a
        href={downloadUrl}
        download
        className="mb-4 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
      >
        <Download className="h-4 w-4" />
        Download EA (.mq5)
      </a>

      {/* Token block (collapsible, in case people want to copy manually) */}
      <details className="rounded-lg border border-white/10 bg-black/30 p-3">
        <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-slate-400">
          Or copy the token manually
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 break-all font-mono text-xs text-slate-200">
            {account.ea_token}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
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
        <p className="mt-2 text-[10px] text-slate-500">
          Keep this private — anyone with the token can push trades to this account.
        </p>
      </details>

      {/* Setup instructions */}
      <details className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3" open>
        <summary className="cursor-pointer text-sm font-medium text-amber-100">
          Setup steps (one time, ~3 minutes)
        </summary>
        <ol className="mt-3 space-y-2.5 pl-4 text-xs text-amber-100/90 list-decimal">
          <li>
            <strong>Whitelist this app in MT5.</strong>{" "}
            In MetaTrader 5: <span className="font-mono text-[11px] text-amber-200">Tools → Options → Expert Advisors</span>. Tick
            <span className="font-mono text-[11px] text-amber-200"> "Allow WebRequest for listed URL"</span> and add:
            <code className="mt-1 block break-all rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-amber-100">
              {typeof window !== "undefined" ? window.location.origin : "https://trade-full-1.vercel.app"}
            </code>
          </li>
          <li>
            <strong>Place the file.</strong>{" "}
            In MT5: <span className="font-mono text-[11px] text-amber-200">File → Open Data Folder → MQL5 → Experts</span>.
            Drop the downloaded <code className="font-mono text-amber-200">.mq5</code> file in there.
          </li>
          <li>
            <strong>Compile it.</strong>{" "}
            Open <span className="font-mono text-[11px] text-amber-200">MetaEditor</span> (press <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px] text-amber-200">F4</kbd> from MT5, or double-click the <code className="font-mono text-amber-200">.mq5</code> file in Experts folder). Then press <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px] text-amber-200">F7</kbd> to compile. You should see <span className="font-mono text-[11px] text-emerald-300">"0 errors, 0 warnings"</span> at the bottom. This step is what makes the EA appear in MT5's Navigator.
          </li>
          <li>
            <strong>Refresh the Navigator</strong> in MT5 (press <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px] text-amber-200">F5</kbd> or right-click Expert Advisors → Refresh).
          </li>
          <li>
            <strong>Drag it onto any chart.</strong>{" "}
            Look for <code className="font-mono text-amber-200">TradeFull1_{account.name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40)}</code> under Expert Advisors (the name matches your downloaded filename). Drop it on any chart — the symbol doesn't matter, the EA monitors the whole account. In the dialog, check <strong>Allow algorithmic trading</strong> → <strong>OK</strong>.
          </li>
          <li>
            <strong>Look for the smiley face</strong> 🙂 in the top-right of the chart — that means the EA is running. The <span className="font-mono text-[11px] text-amber-200">Experts</span> tab at the bottom of MT5 should show <span className="font-mono text-[11px] text-emerald-300">"TradeFull1Sync online. Account #..."</span>. Place a trade, close it, and watch the dashboard light up within ~10 seconds.
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-amber-400" />
        <h3 className="font-serif text-lg">Risk strategy</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">
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
          className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-center text-sm tabular-nums outline-none focus:border-blue-500/50"
        />
        <span className="text-xs text-slate-400">parts</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Each trade risks ≈{" "}
          <span className="text-slate-300 tabular-nums">{(100 / parts).toFixed(1)}%</span>{" "}
          of equity
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving || parts === initialParts}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Deposits & withdrawals</h3>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {addOpen ? "Cancel" : "Add"}
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleAdd}
          className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-5"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "deposit" | "withdrawal")}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          >
            <option value="deposit" className="bg-slate-900">Deposit</option>
            <option value="withdrawal" className="bg-slate-900">Withdrawal</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          />
          <input
            type="datetime-local"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? "…" : "Save"}
          </button>
        </form>
      )}

      {transactions.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
          No transactions yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit";
                return (
                  <tr key={tx.id} className="text-slate-200">
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
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        isDeposit ? "text-emerald-300" : "text-amber-300"
                      )}
                    >
                      {isDeposit ? "+" : "-"}
                      {currency} {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {fmtDate(tx.occurred_at)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {tx.notes ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        className="rounded-md p-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
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
