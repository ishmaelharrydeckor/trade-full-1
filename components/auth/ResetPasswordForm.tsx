import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState<"checking" | "ok" | "missing">(
    "checking"
  );

  // Tracks whether the password reset was completed successfully.
  // Used by the cleanup effect below to decide whether to sign the user out.
  const doneRef = useRef(false);

  // The user arrives here via the email link.
  // We first check if a 'code' query parameter is present in the URL.
  // If so, we perform the code exchange client-side to prevent email scanning bots (which do not run JS)
  // from consuming the code.
  useEffect(() => {
    const supabase = createClient();

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error("Client-side code exchange failed:", error);
            // Fallback: check if session is already active via cookies
            supabase.auth.getSession().then(({ data: { session } }) => {
              setSessionReady(session ? "ok" : "missing");
            });
          } else {
            setSessionReady("ok");
          }
        })
        .catch((err) => {
          console.error("Error during code exchange:", err);
          setSessionReady("missing");
        });
    } else {
      // Fallback: check if session is already active via cookies (e.g. from server callback)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionReady(session ? "ok" : "missing");
      });
    }
  }, [code]);

  // Security: if the user navigates away without completing the password reset,
  // sign them out. Otherwise the recovery session can be used to bypass the
  // password requirement on subsequent visits.
  useEffect(() => {
    return () => {
      if (!doneRef.current) {
        const supabase = createClient();
        supabase.auth.signOut().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    setDone(true);
    doneRef.current = true;
    setSubmitting(false);

    // Redirect to dashboard after a moment so they see the success state
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (sessionReady === "checking") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="mb-3 h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm text-slate-400">Verifying reset link...</p>
      </div>
    );
  }

  if (sessionReady === "missing") {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-amber-400" />
        <h3 className="font-serif text-2xl">Reset link invalid or expired</h3>
        <p className="mt-2 text-sm text-slate-400">
          This password reset link is no longer valid. They expire after 1 hour.
          Request a new one if you still need to reset your password.
        </p>
        <a
          href="/forgot-password"
          className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Request a new link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
        <h3 className="font-serif text-2xl">Password updated</h3>
        <p className="mt-2 text-sm text-slate-400">
          Your password has been changed successfully. Redirecting you to your
          dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
          New password
        </label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        {password.length > 0 && <PasswordStrength password={password} />}
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
          Confirm new password
        </label>
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
        />
        {confirm.length > 0 && confirm !== password && (
          <p className="mt-1 text-[11px] text-red-300">
            Passwords don&apos;t match yet
          </p>
        )}
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
            <Loader2 className="h-4 w-4 animate-spin" /> Updating...
          </>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}