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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* As Mentor: My Students */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="font-serif text-xl">My Students</h2>
        </div>

        {myStudentLinks.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center backdrop-blur" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
            <Eye className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No students yet. Ask a trader to share their invite code with you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {myStudentLinks.map((link) => (
              <div key={link.id} className="rounded-xl p-4 backdrop-blur" style={{ border: '1px solid var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Account: {link.account_id.slice(0, 8)}…</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Since {fmtDate(link.created_at)}</div>
                  </div>
                  <Link
                    href={`/dashboard/mentoring/student/${link.account_id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
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
          <UserPlus className="h-4 w-4" style={{ color: 'var(--positive)' }} />
          <h2 className="font-serif text-xl">Accept an Invite</h2>
        </div>
        <AcceptInvite onAccepted={(link) => setLinks((prev) => [...prev, link])} />
      </section>

      {/* As Mentee: Shared Access */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          <h2 className="font-serif text-xl">My Shared Access</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(accounts I&apos;ve shared with mentors)</span>
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
    <div className="rounded-xl p-4 backdrop-blur" style={{ border: '1px solid var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setSuccess(false); }}
          placeholder="Paste invite code…"
          className="tj-input flex-1"
        />
        <button
          type="button"
          onClick={handleAccept}
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--positive)', color: 'var(--text-primary)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Accept
        </button>
      </div>
      {error && <p className="mt-2 text-xs" style={{ color: 'var(--negative)' }}>{error}</p>}
      {success && <p className="mt-2 text-xs" style={{ color: 'var(--positive)' }}>Invite accepted! You can now view their dashboard.</p>}
    </div>
  );
}
