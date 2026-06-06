// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push(next);
    router.refresh();
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

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs uppercase tracking-wider text-slate-400">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-[11px] text-blue-400 hover:underline"
          >
            Forgot?
          </a>
        </div>
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
        style={{
          background: 'linear-gradient(135deg, #4F46E5, #10B981)',
        }}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Accessing..." : "Access Execution System"}
      </button>

      <div className="mt-6 border-t border-white/5 pt-4 text-center space-y-2.5">
        <p className="text-[11px] font-medium tracking-wide text-emerald-400">
          Used by traders focused on execution discipline, not just trade tracking.
        </p>
        <p className="text-[10px] text-slate-400 italic leading-relaxed">
          &ldquo;Early beta users are discovering behavioral patterns they never tracked before.&rdquo;
        </p>
      </div>
    </form>
  );
}
