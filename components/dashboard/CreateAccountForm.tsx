// components/dashboard/CreateAccountForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const POPULAR_BROKERS = {
  brokers: [
    { value: "Exness", label: "Exness" },
    { value: "IC Markets", label: "IC Markets" },
    { value: "Pepperstone", label: "Pepperstone" },
    { value: "XM", label: "XM" },
    { value: "OctaFX", label: "OctaFX" },
    { value: "Deriv", label: "Deriv" },
    { value: "Vantage Markets", label: "Vantage Markets" },
    { value: "Interactive Brokers", label: "Interactive Brokers" },
    { value: "AvaTrade", label: "AvaTrade" },
    { value: "RoboForex", label: "RoboForex" },
    { value: "Hantec Markets", label: "Hantec Markets" },
  ],
  props: [
    { value: "FTMO", label: "FTMO" },
    { value: "FundedNext", label: "FundedNext" },
    { value: "Apex Trader Funding", label: "Apex Trader Funding" },
    { value: "Funding Pips", label: "Funding Pips" },
    { value: "E8 Funding", label: "E8 Funding" },
    { value: "Topstep", label: "Topstep" },
    { value: "Bespoke Funding", label: "Bespoke Funding" },
  ]
};

const CURRENCIES = ["USD", "EUR", "GBP", "GHS", "NGN", "ZAR", "JPY"];

export default function CreateAccountForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("Exness");
  const [customBroker, setCustomBroker] = useState("");
  const [broker, setBroker] = useState("Exness");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startingBalance, setStartingBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrokerDropdownChange = (val: string) => {
    setSelectedBroker(val);
    if (val !== "CUSTOM") {
      setBroker(val);
    } else {
      setBroker(customBroker);
    }
  };

  const handleCustomBrokerChange = (val: string) => {
    setCustomBroker(val);
    setBroker(val);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    if (startingBalance && Number(startingBalance) < 0) {
      setError("Starting balance cannot be negative.");
      setSubmitting(false);
      return;
    }

    const { data: newAccount, error: insertErr } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        broker: broker.trim() || null,
        account_number: accountNumber.trim() || null,
        currency,
        starting_balance: startingBalance ? Number(startingBalance) : null,
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    router.push(`/dashboard/accounts/${newAccount.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Account name *" hint="What you'll call it in the dashboard">
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main live account, FTMO Challenge, Demo"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Broker">
          <div className="flex flex-col gap-2">
            <select
              value={selectedBroker}
              onChange={(e) => handleBrokerDropdownChange(e.target.value)}
              className={inputClass}
            >
              <optgroup label="Popular Brokers">
                {POPULAR_BROKERS.brokers.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Prop Firms">
                {POPULAR_BROKERS.props.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <option value="CUSTOM">Custom / Other...</option>
            </select>
            {selectedBroker === "CUSTOM" && (
              <input
                required
                type="text"
                value={customBroker}
                onChange={(e) => handleCustomBrokerChange(e.target.value)}
                placeholder="Enter custom broker or prop firm"
                className={inputClass}
              />
            )}
          </div>
        </Field>
        <Field label="Account number">
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="e.g. 12345678"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Starting balance" hint="Optional, you can set this later">
          <input
            type="number"
            step="any"
            min="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)', color: 'var(--negative)' }}>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="tj-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition duration-150 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating…" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/accounts")}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition duration-150"
          style={{ borderColor: 'var(--app-border)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "tj-input w-full rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition duration-150";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}
