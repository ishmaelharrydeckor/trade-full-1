// app/admin/feedback/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, MessageSquare } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import FeedbackManager from "@/components/admin/FeedbackManager";
import { type BetaFeedbackRow } from "@/components/admin/AdminFeedbackTable";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-slate-500" />
        <h1 className="font-serif text-2xl">Admin only</h1>
        <p className="mt-2 text-sm text-slate-400">
          This page is restricted. To grant yourself admin access, run this in
          Supabase SQL Editor:
        </p>
        <pre className="mx-auto mt-4 max-w-md overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-left text-xs text-slate-300">
{`UPDATE public.profiles
SET is_admin = TRUE
WHERE id = '${user.id}';`}
        </pre>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-xs text-blue-400 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  // Use service role to access the database
  const admin = createServiceClient();

  const { data: feedbackData, error: feedbackErr } = await admin
    .from("beta_feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (feedbackErr) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-400">Failed to load feedback: {feedbackErr.message}</p>
      </div>
    );
  }

  const feedback: BetaFeedbackRow[] = feedbackData ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          <h1 className="font-serif text-3xl">Beta Feedback Dashboard</h1>
        </div>
        
        <Link
          href="/admin/users"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Manage Users
        </Link>
      </div>

      <FeedbackManager feedback={feedback} />
    </div>
  );
}
