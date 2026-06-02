// app/admin/users/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import AdminUsersTable, { type AdminUserRow } from "@/components/admin/AdminUsersTable";

export const dynamic = "force-dynamic"; // never cache

export default async function AdminUsersPage() {
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

  // Use service role to access auth.users (anon client can't reach the auth schema)
  const admin = createServiceClient();

  // Fetch all auth users
  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (authErr) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-400">Failed to load users: {authErr.message}</p>
      </div>
    );
  }

  // Fetch profiles, account counts, trade counts in parallel
  const [profilesRes, accountsRes, tradesRes] = await Promise.all([
    admin.from("profiles").select("id, display_name, country, is_admin"),
    admin.from("accounts").select("user_id"),
    admin.from("trades").select("user_id"),
  ]);

  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );

  const accountCount = new Map<string, number>();
  for (const a of accountsRes.data ?? []) {
    accountCount.set(a.user_id, (accountCount.get(a.user_id) ?? 0) + 1);
  }

  const tradeCount = new Map<string, number>();
  for (const t of tradesRes.data ?? []) {
    tradeCount.set(t.user_id, (tradeCount.get(t.user_id) ?? 0) + 1);
  }

  const rows: AdminUserRow[] = authData.users
    .map((u) => {
      const p = profilesMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "(no email)",
        display_name: p?.display_name ?? null,
        country: p?.country ?? null,
        is_admin: !!p?.is_admin,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        accounts: accountCount.get(u.id) ?? 0,
        trades: tradeCount.get(u.id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-400" />
        <h1 className="font-serif text-3xl">Users · {rows.length}</h1>
      </div>

      <AdminUsersTable initialUsers={rows} />
    </div>
  );
}
