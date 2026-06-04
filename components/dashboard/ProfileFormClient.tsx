"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileFormClient({
  email,
  initialDisplayName,
  initialCountry,
}: {
  email: string;
  initialDisplayName: string;
  initialCountry: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Session expired. Please sign in again.");
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          country: country.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Email Address
        </label>
        <input
          disabled
          type="email"
          value={email}
          className="tj-input w-full rounded-lg border px-3 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed"
          title="Email cannot be changed"
        />
        <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Contact support to change your account email.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Display Name
        </label>
        <input
          required
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Ishmael"
          className="tj-input w-full rounded-lg border px-3 py-2.5 text-sm font-medium"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Country
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. Ghana, United States"
          className="tj-input w-full rounded-lg border px-3 py-2.5 text-sm font-medium"
        />
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--negative)' }}>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs">
          {success && (
            <span style={{ color: "var(--positive)" }}>
              ✓ Profile updated successfully!
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="tj-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
