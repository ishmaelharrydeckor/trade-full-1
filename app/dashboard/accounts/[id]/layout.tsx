// app/dashboard/accounts/[id]/layout.tsx
// Per-account layout. We render a back link + account header here,
// then the page itself owns the tab UI and content.

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AccountHeader from "@/components/dashboard/AccountHeader";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, broker, account_number, currency, starting_balance, ea_token, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!account) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader account={account} />
      {children}
    </div>
  );
}
