"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";
import type { Account, Trade, AccountTransaction, AccountSettings } from "@/types/database";
import { computeCurrentEquity } from "@/lib/stats";
import PositionCalculator from "@/components/account/PositionCalculator";

export default function CalculatorTab({
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
    <div className="flex flex-col gap-6 w-full">
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
    </div>
  );
}

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
    <div className="rounded-xl p-5" style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color: "var(--warning)" }} />
        <h3 className="text-lg font-bold">Risk strategy</h3>
      </div>
      <p className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        How many equal parts do you divide your account into per trade? A 10-part strategy means each trade risks 1/10
        of your current equity. The position calculator uses this.
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
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>parts</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Each trade risks ≈{" "}
          <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{(100 / parts).toFixed(1)}%</span>{" "}
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
