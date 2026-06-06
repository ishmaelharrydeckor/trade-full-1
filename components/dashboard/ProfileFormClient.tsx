"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormClientProps {
  email: string;
  initialDisplayName: string;
  initialCountry: string;
  initialTimezone?: string;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "Ghana",
  "Nigeria",
  "South Africa",
  "United Arab Emirates",
  "India",
  "Brazil",
];

const TIMEZONES = [
  "UTC",
  "GMT",
  "EST",
  "CST",
  "MST",
  "PST",
  "CET",
  "EET",
  "GST",
  "SGT",
  "AEST",
];

export default function ProfileFormClient({
  email,
  initialDisplayName,
  initialCountry,
  initialTimezone = "UTC",
}: ProfileFormClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [country, setCountry] = useState(initialCountry);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load timezone from localStorage if not provided or as fallback
  useEffect(() => {
    if (!initialTimezone) {
      const localTz = localStorage.getItem("tj-profile-timezone");
      if (localTz) {
        setTimezone(localTz);
      }
    }
  }, [initialTimezone]);

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

      // Try updating display_name, country, and timezone.
      // If timezone column does not exist, we catch the database error and save it to localStorage instead.
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          country: country.trim() || null,
          timezone: timezone.trim() || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", user.id);

      if (updateErr) {
        // Fallback to update without timezone column
        const { error: fallbackErr } = await supabase
          .from("profiles")
          .update({
            display_name: displayName.trim() || null,
            country: country.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (fallbackErr) throw fallbackErr;

        // Persist timezone in localStorage as fallback
        localStorage.setItem("tj-profile-timezone", timezone);
      } else {
        localStorage.setItem("tj-profile-timezone", timezone);
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Visual Success border glow */}
      <style>{`
        .success-glow {
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4) !important;
          transition: all 0.5s ease;
        }
      `}</style>

      <div className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Email Address
          </label>
          <input
            disabled
            type="email"
            value={email}
            className="w-full rounded-xl border border-slate-800 bg-[#07090d]/50 px-4 py-3 text-sm font-medium text-slate-400 opacity-60 cursor-not-allowed outline-none"
            title="Email cannot be changed"
          />
          <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
            Contact support to change your account email.
          </p>
        </div>

        {/* Display Name Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Display Name
          </label>
          <input
            required
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
            className="w-full rounded-xl border border-slate-800 bg-[#07090d]/30 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Country Select Dropdown */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Country / Region
          </label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#07090d]/30 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="" disabled className="bg-[#0f1318]">Select Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-[#0f1318] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone Select Dropdown */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Timezone (Optional)
          </label>
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#07090d]/30 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-indigo-500 transition-colors"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-[#0f1318] text-white">
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400">
          {error}
        </div>
      )}

      {/* Button & Inline Success Confirmation */}
      <div className="flex flex-col gap-3 pt-3">
        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-500/10 active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : null}
          {saving ? "Saving Changes…" : success ? "Changes Saved!" : "Save Profile Settings"}
        </button>

        {success && (
          <p className="text-center text-[10px] font-bold text-emerald-400 animate-pulse">
            ✓ Identity details updated successfully.
          </p>
        )}
      </div>
    </form>
  );
}

