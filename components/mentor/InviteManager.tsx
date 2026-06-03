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
      <div className="flex items-center gap-2">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="tj-input flex-1"
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
          className="tj-btn-primary inline-flex items-center gap-1.5"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Generate invite
        </button>
      </div>

      {/* Existing links */}
      {allLinks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No shared accounts yet. Generate an invite to share with your mentor.</p>
      ) : (
        <div className="space-y-2">
          {allLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ border: '1px solid var(--app-border)', backgroundColor: 'var(--app-elevated)' }}>
              <div className="min-w-0 flex-1">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Account: {link.account_id.slice(0, 8)}… · {fmtDate(link.created_at)}
                </div>
                {link.status === "pending" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="text-xs font-mono break-all" style={{ color: 'var(--accent)' }}>{link.invite_code}</code>
                    <button
                      type="button"
                      onClick={() => copyCode(link.invite_code, link.id)}
                      className="shrink-0 rounded p-1 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {copiedId === link.id ? <Check className="h-3 w-3" style={{ color: 'var(--positive)' }} /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider"
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
                  className="shrink-0 rounded-md p-1 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Revoke access"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
