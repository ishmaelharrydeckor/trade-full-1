// components/auth/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // We deliberately show a generic error here rather than exposing
      // whether the email exists. Standard auth security practice.
      setError(
        "Something went wrong. Please try again in a moment, or contact support."
      );
      setSubmitting(false);
      return;
    }

    // Supabase doesn't tell us whether the email actually exists (good — prevents
    // email enumeration). Either way, show success.
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
        <h3 className="font-serif text-2xl">Check your email</h3>
        <p className="mt-2 text-sm text-slate-400">
          If an account exists for{" "}
          <span className="text-white">{email}</span>, we've sent a password
          reset link. Click it to set a new password.
        </p>
        <p className="mt-3 text-[11px] text-slate-500">
          Don&apos;t see it? Check your spam folder.
        </p>
        <a
          href="/login"
          className="mt-5 text-xs text-blue-400 hover:underline"
        >
          ← Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pr-3 text-sm outline-none transition focus:border-blue-500/50"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </button>

      <p className="text-center text-[11px] text-slate-500">
        We&apos;ll send a link to your email. The link expires in 1 hour.
      </p>
    </form>
  );
}
