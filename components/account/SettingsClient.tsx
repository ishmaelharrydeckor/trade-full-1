// components/account/SettingsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  KeyRound,
  AlertTriangle,
  Archive,
  Trash2,
  ArchiveRestore,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number | null;
  ea_token: string;
  archived: boolean;
}

export default function SettingsClient({ account }: { account: Account }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure your account. Changes save individually per section.
        </p>
      </div>

      <AccountInfoSection account={account} onSaved={() => router.refresh()} />
      <EaTokenSection account={account} />
      <DangerZone account={account} />
    </div>
  );
}

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

// ============================================================
// Account info
// ============================================================
function AccountInfoSection({
  account,
  onSaved,
}: {
  account: Account;
  onSaved: () => void;
}) {
  const popularBrokerValues = [
    "Exness", "IC Markets", "Pepperstone", "XM", "OctaFX", "Deriv", "Vantage Markets",
    "Interactive Brokers", "AvaTrade", "RoboForex", "Hantec Markets",
    "FTMO", "FundedNext", "Apex Trader Funding", "Funding Pips", "E8 Funding", "Topstep", "Bespoke Funding"
  ];

  const isInitialCustom = account.broker ? !popularBrokerValues.includes(account.broker) : false;

  const [name, setName] = useState(account.name);
  const [selectedBroker, setSelectedBroker] = useState(
    account.broker ? (isInitialCustom ? "CUSTOM" : account.broker) : "Exness"
  );
  const [customBroker, setCustomBroker] = useState(
    account.broker && isInitialCustom ? account.broker : ""
  );
  const [broker, setBroker] = useState(account.broker ?? "Exness");

  const [accountNumber, setAccountNumber] = useState(
    account.account_number ?? ""
  );
  const [startingBalance, setStartingBalance] = useState(
    String(account.starting_balance ?? "")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (parseFloat(startingBalance) < 0) {
      setError("Starting balance cannot be negative.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          broker: broker.trim() || null,
          account_number: accountNumber.trim() || null,
          starting_balance: parseFloat(startingBalance) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Account info" subtitle="Display name, broker, balance">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Account name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tj-input"
          />
        </Field>
        <Field label="Broker">
          <div className="flex flex-col gap-2">
            <select
              value={selectedBroker}
              onChange={(e) => handleBrokerDropdownChange(e.target.value)}
              className="tj-input"
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
                className="tj-input"
              />
            )}
          </div>
        </Field>
        <Field label="Account number">
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="MT5 login"
            className="tj-input"
          />
        </Field>
        <Field label={`Starting balance (${account.currency})`}>
          <input
            type="number"
            step="any"
            min="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className="tj-input"
          />
        </Field>
      </div>
      <div
        className="mt-2 rounded-lg p-2.5 text-xs"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'color-mix(in srgb, var(--warning) 20%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--warning) 5%, transparent)',
          color: 'var(--warning)',
        }}
      >
        ⚠ Changing the starting balance recomputes all your KPIs and the equity
        curve. Use it to correct a wrong initial value, not to manipulate
        history.
      </div>
      <ActionFooter
        onSave={save}
        saving={saving}
        success={success}
        error={error}
      />
    </Section>
  );
}

// ============================================================
// EA token
// ============================================================
function EaTokenSection({ account }: { account: Account }) {
  const [token, setToken] = useState(account.ea_token);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rotate() {
    if (
      !confirm(
        "Rotate the EA token? Your currently running MT5 EA will need to be re-downloaded and reinstalled before it can sync trades again."
      )
    ) {
      return;
    }
    setRotating(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${account.id}/rotate-token`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rotation failed");
      setToken(data.ea_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRotating(false);
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Section
      title="MT5 connection token"
      subtitle="Used by the Expert Advisor to authenticate with your account"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={token}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 font-mono text-xs"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--app-border)',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-secondary)',
          }}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copyToken}
          className="tj-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" style={{ color: 'var(--positive)' }} />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={rotate}
          disabled={rotating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs disabled:opacity-50"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
            color: 'var(--warning)',
          }}
        >
          {rotating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          {rotating ? "Rotating…" : "Rotate token"}
        </button>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Rotate the token if you suspect it leaked (e.g. shared the wrong file,
        used a public computer). After rotation, re-download the EA from your
        Account tab and reinstall it in MT5.
      </p>
      {error && (
        <div
          className="mt-2 rounded-lg p-2 text-xs"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)',
            color: 'var(--negative)',
          }}
        >
          {error}
        </div>
      )}
    </Section>
  );
}

// ============================================================
// Danger zone
// ============================================================
function DangerZone({ account }: { account: Account }) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function toggleArchive() {
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !account.archived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setArchiving(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm_name: confirmText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'color-mix(in srgb, var(--negative) 20%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--negative) 4%, transparent)',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--negative)' }} />
        <h3 className="font-serif text-lg" style={{ color: 'var(--negative)' }}>Danger zone</h3>
      </div>

      <div className="space-y-3">
        {/* Archive */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-3"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--app-border)',
            backgroundColor: 'var(--app-elevated)',
          }}
        >
          <div>
            <div className="text-sm font-medium">
              {account.archived ? "Unarchive account" : "Archive account"}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {account.archived
                ? "This account is hidden from your dashboard. Restore it to view again."
                : "Hide this account from your dashboard without deleting any data. Reversible."}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs disabled:opacity-50"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
              color: 'var(--warning)',
            }}
          >
            {archiving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : account.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {account.archived ? "Unarchive" : "Archive"}
          </button>
        </div>

        {/* Delete */}
        <div
          className="rounded-lg p-3"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'color-mix(in srgb, var(--negative) 20%, transparent)',
            backgroundColor: 'var(--app-elevated)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--negative)' }}>
                Delete account permanently
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Wipes the account + every trade, transaction, position, AI
                insight, and backtest session attached to it. Cannot be undone.
              </div>
            </div>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)',
                  color: 'var(--negative)',
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </button>
            )}
          </div>

          {showDeleteConfirm && (
            <div
              className="mt-3 rounded-md p-3"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--negative) 5%, transparent)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--negative)' }}>
                Type{" "}
                <code
                  className="rounded px-1 font-mono"
                  style={{
                    backgroundColor: 'var(--app-elevated)',
                    color: 'var(--negative)',
                  }}
                >
                  {account.name}
                </code>{" "}
                below to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={account.name}
                className="mt-2 w-full rounded-md px-3 py-2 font-mono text-sm outline-none"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
                  backgroundColor: 'var(--input-bg)',
                }}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="tj-btn-secondary rounded-lg px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting || confirmText !== account.name}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    "disabled:opacity-50"
                  )}
                  style={
                    confirmText === account.name
                      ? {
                          backgroundColor: 'var(--negative)',
                          color: 'var(--text-primary)',
                        }
                      : {
                          backgroundColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
                          color: 'var(--negative)',
                          cursor: 'not-allowed',
                        }
                  }
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Permanently delete
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            className="rounded-lg p-2 text-xs"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)',
              color: 'var(--negative)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Shared bits
// ============================================================
const inputClass = "tj-input";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 backdrop-blur"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--app-border)',
        backgroundColor: 'var(--app-surface)',
      }}
    >
      <div className="mb-4">
        <h3 className="font-serif text-lg">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ActionFooter({
  onSave,
  saving,
  success,
  error,
}: {
  onSave: () => void;
  saving: boolean;
  success: boolean;
  error: string | null;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <div className="text-xs">
        {success && (
          <span style={{ color: 'var(--positive)' }}>
            ✓ Saved
          </span>
        )}
        {error && <span style={{ color: 'var(--negative)' }}>{error}</span>}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="tj-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Save
      </button>
    </div>
  );
}
