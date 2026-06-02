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
        <p className="mt-1 text-sm text-slate-400">
          Configure your account. Changes save individually per section.
        </p>
      </div>

      <AccountInfoSection account={account} onSaved={() => router.refresh()} />
      <EaTokenSection account={account} />
      <DangerZone account={account} />
    </div>
  );
}

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
  const [name, setName] = useState(account.name);
  const [broker, setBroker] = useState(account.broker ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account.account_number ?? ""
  );
  const [startingBalance, setStartingBalance] = useState(
    String(account.starting_balance ?? "")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
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
            className={inputClass}
          />
        </Field>
        <Field label="Broker">
          <input
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
            placeholder="e.g. FBS, Exness, Pepperstone"
            className={inputClass}
          />
        </Field>
        <Field label="Account number">
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="MT5 login"
            className={inputClass}
          />
        </Field>
        <Field label={`Starting balance (${account.currency})`}>
          <input
            type="number"
            step="any"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-100/90">
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
          className="flex-1 min-w-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-300"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copyToken}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={rotate}
          disabled={rotating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
        >
          {rotating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          {rotating ? "Rotating…" : "Rotate token"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Rotate the token if you suspect it leaked (e.g. shared the wrong file,
        used a public computer). After rotation, re-download the EA from your
        Account tab and reinstall it in MT5.
      </p>
      {error && (
        <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
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
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <h3 className="font-serif text-lg text-red-100">Danger zone</h3>
      </div>

      <div className="space-y-3">
        {/* Archive */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div>
            <div className="text-sm font-medium">
              {account.archived ? "Unarchive account" : "Archive account"}
            </div>
            <div className="text-xs text-slate-400">
              {account.archived
                ? "This account is hidden from your dashboard. Restore it to view again."
                : "Hide this account from your dashboard without deleting any data. Reversible."}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
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
        <div className="rounded-lg border border-red-500/20 bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-red-200">
                Delete account permanently
              </div>
              <div className="text-xs text-slate-400">
                Wipes the account + every trade, transaction, position, AI
                insight, and backtest session attached to it. Cannot be undone.
              </div>
            </div>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3">
              <p className="text-xs text-red-100">
                Type{" "}
                <code className="rounded bg-black/30 px-1 font-mono text-red-200">
                  {account.name}
                </code>{" "}
                below to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={account.name}
                className="mt-2 w-full rounded-md border border-red-500/30 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-red-500"
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting || confirmText !== account.name}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    confirmText === account.name
                      ? "bg-red-500 text-white hover:bg-red-400"
                      : "bg-red-500/30 text-red-200 cursor-not-allowed",
                    "disabled:opacity-50"
                  )}
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Permanently delete
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
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
const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-blue-500/50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-4">
        <h3 className="font-serif text-lg">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
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
          <span className="text-emerald-300">
            ✓ Saved
          </span>
        )}
        {error && <span className="text-red-300">{error}</span>}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
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
