// app/dashboard/accounts/[id]/backtest/[sessionId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BacktestSessionClient from "@/components/backtest/BacktestSessionClient";

export default async function BacktestSessionPage({
  params,
}: {
  params: { id: string; sessionId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("id", params.sessionId)
    .eq("account_id", params.id)
    .maybeSingle();

  if (!session || session.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link
        href={`/dashboard/accounts/${params.id}/backtest`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to backtests
      </Link>

      <BacktestSessionClient session={session as never} />
    </div>
  );
}
