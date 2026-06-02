// app/dashboard/accounts/[id]/settings/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/account/SettingsClient";

export default async function AccountSettingsPage({
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
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!account || account.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href={`/dashboard/accounts/${params.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to {account.name}
      </Link>

      <SettingsClient account={account as never} />
    </div>
  );
}
