"use client";

import { useState } from "react";
import { Copy, Check, Plus, Loader2, XCircle, Share2 } from "lucide-react";
import type { MentorLink } from "@/types/database";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SimpleAccount {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
}

export default function InviteManager({
  accounts,
  links,
  onRevoke,
}: {
  accounts: SimpleAccount[];
  links: MentorLink[];
  onRevoke: (linkId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinks, setNewLinks] = useState<MentorLink[]>([]);

  const allLinks = [...links, ...newLinks];

  async function createInvite() {
    if (!selectedAccount) return;
    setCreating(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccount }),
      });
      const data = await res.json();
      if (res.ok && data.link) {
        setNewLinks((prev) => [...prev, data.link]);
      }
    } finally {
      setCreating(false);
    }
  }

  function copyCode(code: string, linkId: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Create new invite */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="tj-input flex-1 w-full"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id} style={{ backgroundColor: 'var(--app-bg)' }}>
              {a.name} {a.broker ? `(${a.broker})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={createInvite}
          disabled={creating || !selectedAccount}
          className="tj-btn-primary inline-flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
          style={{ minHeight: "44px" }}
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Generate invite
        </button>
      </div>

      {/* Existing links */}
      {allLinks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No shared accounts yet. Generate an invite to share with your mentor.</p>
      ) : (
        <div className="space-y-3">
          {allLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 shadow-sm"
              style={{ border: '1px solid var(--app-border)', backgroundColor: 'var(--app-elevated)' }}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Account: {link.account_id.slice(0, 8)}… · {fmtDate(link.created_at)}
                </div>
                {link.status === "pending" && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <code className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded break-all border border-white/5" style={{ color: 'var(--accent)' }}>
                      {link.invite_code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCode(link.invite_code, link.id)}
                      className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Copy invite code"
                    >
                      {copiedId === link.id ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--positive)' }} /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span
                  className="shrink-0 rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-extrabold"
                  style={
                    link.status === "active"
                      ? { backgroundColor: 'color-mix(in srgb, var(--positive) 10%, transparent)', color: 'var(--positive)' }
                      : link.status === "pending"
                        ? { backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)', color: 'var(--warning)' }
                        : { backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)', color: 'var(--negative)' }
                  }
                >
                  {link.status}
                </span>
                {link.status !== "revoked" && (
                  <button
                    type="button"
                    onClick={() => onRevoke(link.id)}
                    className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Revoke access"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
