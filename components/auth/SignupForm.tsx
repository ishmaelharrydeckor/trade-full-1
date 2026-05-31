// components/auth/SignupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNeedsConfirmation(true);
      setSubmitting(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
        <h3 className="font-serif text-2xl">Check your email</h3>
        <p className="mt-2 text-sm text-slate-400">
          We sent a confirmation link to{" "}
          <span className="text-white">{email}</span>. Click it to activate
          your account, then sign in.
        </p>
        <p className="mt-3 text-[11px] text-slate-500">
          Don&apos;t see it? Check your spam folder.
        </p>
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
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500/50"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
          Password
        </label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
        />
        <PasswordStrength password={password} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-[11px] text-slate-500">
        By signing up, you accept that this is an early-stage product and
        things may break.
      </p>
    </form>
  );
}
