// app/dashboard/accounts/[id]/backtest/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BacktestListClient from "@/components/backtest/BacktestListClient";

export default async function BacktestListPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!account || account.user_id !== user.id) notFound();

  const { data: sessions } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("account_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link
        href={`/dashboard/accounts/${params.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to {account.name}
      </Link>

      <BacktestListClient
        accountId={params.id}
        initialSessions={(sessions ?? []) as never}
      />
    </div>
  );
}
