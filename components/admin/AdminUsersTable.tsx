// components/admin/AdminUsersTable.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Mail,
  Check,
  Loader2,
  Crown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  country: string | null;
  is_admin: boolean;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  accounts: number;
  trades: number;
}

type SortKey = "created_at" | "email" | "last_sign_in_at" | "accounts" | "trades";

export default function AdminUsersTable({
  initialUsers,
}: {
  initialUsers: AdminUserRow[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let arr = users;
    if (q) {
      arr = arr.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          (u.country ?? "").toLowerCase().includes(q)
      );
    }
    arr = [...arr].sort((a, b) => {
      const getValue = (u: AdminUserRow) => {
        if (sortKey === "email") return u.email.toLowerCase();
        if (sortKey === "accounts") return u.accounts;
        if (sortKey === "trades") return u.trades;
        if (sortKey === "last_sign_in_at")
          return u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
        return new Date(u.created_at).getTime();
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (va === vb) return 0;
      const cmp = va > vb ? 1 : -1;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [users, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function manuallyConfirm(userId: string) {
    if (!confirm("Manually confirm this user's email? They'll be able to log in immediately.")) return;
    setConfirmingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/confirm-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, email_confirmed_at: new Date().toISOString() }
              : u
          )
        );
      } else {
        alert(`Failed: ${data.error ?? "Unknown error"}`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by email, name, or country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500/50"
        />
      </div>

      {/* Counts */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span>
          <span className="text-slate-200">{users.length}</span> total
        </span>
        <span>·</span>
        <span>
          <span className="text-emerald-300">
            {users.filter((u) => u.email_confirmed_at && u.last_sign_in_at).length}
          </span>{" "}
          active
        </span>
        <span>·</span>
        <span>
          <span className="text-amber-300">
            {users.filter((u) => u.email_confirmed_at && !u.last_sign_in_at).length}
          </span>{" "}
          confirmed but never logged in
        </span>
        <span>·</span>
        <span>
          <span className="text-red-300">
            {users.filter((u) => !u.email_confirmed_at).length}
          </span>{" "}
          not confirmed
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <SortableTh
                label="Email"
                col="email"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <th className="px-3 py-3 text-left">Name</th>
              <th className="px-3 py-3 text-left">Country</th>
              <SortableTh
                label="Signed up"
                col="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortableTh
                label="Last login"
                col="last_sign_in_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortableTh
                label="Accts"
                col="accounts"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <SortableTh
                label="Trades"
                col="trades"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((u) => {
              const status = getStatus(u);
              return (
                <tr key={u.id} className="text-slate-200">
                  <td className="max-w-[260px] truncate px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {u.is_admin && (
                        <Crown
                          className="h-3 w-3 shrink-0 text-amber-400"
                          aria-label="Admin"
                        />
                      )}
                      <span className="truncate">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">
                    {u.display_name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">
                    {u.country ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 tabular-nums">
                    {fmtRelative(u.created_at)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 tabular-nums">
                    {u.last_sign_in_at ? fmtRelative(u.last_sign_in_at) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400">
                    {u.accounts}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400">
                    {u.trades}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                        status.color
                      )}
                    >
                      {status.icon} {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {!u.email_confirmed_at && (
                      <button
                        type="button"
                        onClick={() => manuallyConfirm(u.id)}
                        disabled={confirmingId === u.id}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {confirmingId === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-500">
        Tip: Hit ⌘+R (or F5) to refresh the data.
      </p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = sortKey === col;
  return (
    <th
      className={cn(
        "px-3 py-3 cursor-pointer select-none",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => onClick(col)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          isActive && "text-slate-200"
        )}
      >
        {label}
        {isActive &&
          (sortDir === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          ))}
      </span>
    </th>
  );
}

function getStatus(u: AdminUserRow): {
  label: string;
  color: string;
  icon: string;
} {
  if (!u.email_confirmed_at)
    return {
      label: "Not confirmed",
      color: "bg-red-500/15 text-red-300",
      icon: "⏳",
    };
  if (!u.last_sign_in_at)
    return {
      label: "Never logged in",
      color: "bg-amber-500/15 text-amber-300",
      icon: "📧",
    };
  return {
    label: "Active",
    color: "bg-emerald-500/15 text-emerald-300",
    icon: "✅",
  };
}

function fmtRelative(iso: string): string {
  const date = new Date(iso);
  const ageMs = Date.now() - date.getTime();
  const ageMin = ageMs / 60000;
  const ageHr = ageMin / 60;
  const ageDay = ageHr / 24;
  if (ageMin < 1) return "just now";
  if (ageMin < 60) return `${Math.floor(ageMin)}m ago`;
  if (ageHr < 24) return `${Math.floor(ageHr)}h ago`;
  if (ageDay < 7) return `${Math.floor(ageDay)}d ago`;
  return date.toLocaleDateString();
}
