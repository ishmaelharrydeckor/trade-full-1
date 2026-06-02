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
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id} className="bg-slate-900">
              {a.name} {a.broker ? `(${a.broker})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={createInvite}
          disabled={creating || !selectedAccount}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Generate invite
        </button>
      </div>

      {/* Existing links */}
      {allLinks.length === 0 ? (
        <p className="text-sm text-slate-500">No shared accounts yet. Generate an invite to share with your mentor.</p>
      ) : (
        <div className="space-y-2">
          {allLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500">
                  Account: {link.account_id.slice(0, 8)}… · {fmtDate(link.created_at)}
                </div>
                {link.status === "pending" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="text-xs font-mono text-blue-300 break-all">{link.invite_code}</code>
                    <button
                      type="button"
                      onClick={() => copyCode(link.invite_code, link.id)}
                      className="shrink-0 rounded p-1 text-slate-400 hover:text-white"
                    >
                      {copiedId === link.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>
              <span className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider",
                link.status === "active" ? "bg-emerald-500/10 text-emerald-300"
                  : link.status === "pending" ? "bg-amber-500/10 text-amber-300"
                  : "bg-red-500/10 text-red-300"
              )}>
                {link.status}
              </span>
              {link.status !== "revoked" && (
                <button
                  type="button"
                  onClick={() => onRevoke(link.id)}
                  className="shrink-0 rounded-md p-1 text-slate-500 hover:text-red-300"
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
