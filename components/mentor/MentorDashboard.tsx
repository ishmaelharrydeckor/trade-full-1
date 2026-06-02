"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Share2,
  Copy,
  Check,
  Loader2,
  Eye,
  XCircle,
  UserPlus,
  Shield,
} from "lucide-react";
import type { MentorLink } from "@/types/database";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import InviteManager from "./InviteManager";

interface SimpleAccount {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
}

export default function MentorDashboard({
  userId,
  accounts,
}: {
  userId: string;
  accounts: SimpleAccount[];
}) {
  const router = useRouter();
  const [links, setLinks] = useState<MentorLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentor")
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []))
      .finally(() => setLoading(false));
  }, []);

  const myStudentLinks = links.filter((l) => l.mentor_id === userId && l.status === "active");
  const myMentorLinks = links.filter((l) => l.mentee_id === userId);

  async function revokeLink(linkId: string) {
    if (!confirm("Revoke this mentoring access?")) return;
    await fetch(`/api/mentor/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revoked" }),
    });
    setLinks((prev) => prev.map((l) => l.id === linkId ? { ...l, status: "revoked" as const } : l));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* As Mentor: My Students */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          <h2 className="font-serif text-xl">My Students</h2>
        </div>

        {myStudentLinks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center backdrop-blur">
            <Eye className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">No students yet. Ask a trader to share their invite code with you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {myStudentLinks.map((link) => (
              <div key={link.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Account: {link.account_id.slice(0, 8)}…</div>
                    <div className="text-xs text-slate-500">Since {fmtDate(link.created_at)}</div>
                  </div>
                  <Link
                    href={`/dashboard/mentoring/student/${link.account_id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/20"
                  >
                    <Eye className="h-3 w-3" /> View dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Accept invite */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-emerald-400" />
          <h2 className="font-serif text-xl">Accept an Invite</h2>
        </div>
        <AcceptInvite onAccepted={(link) => setLinks((prev) => [...prev, link])} />
      </section>

      {/* As Mentee: Shared Access */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <h2 className="font-serif text-xl">My Shared Access</h2>
          <span className="text-xs text-slate-500">(accounts I&apos;ve shared with mentors)</span>
        </div>

        <InviteManager accounts={accounts} links={myMentorLinks} onRevoke={revokeLink} />
      </section>
    </div>
  );
}

function AcceptInvite({ onAccepted }: { onAccepted: (link: MentorLink) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to accept");
      onAccepted(data.link);
      setSuccess(true);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setSuccess(false); }}
          placeholder="Paste invite code…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-blue-500/50"
        />
        <button
          type="button"
          onClick={handleAccept}
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Accept
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-300">Invite accepted! You can now view their dashboard.</p>}
    </div>
  );
}
