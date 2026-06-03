// app/dashboard/layout.tsx
// Protected layout. Middleware enforces auth, but we also fetch the user
// + profile here so the nav can show their display name.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pull the profile row created by the on_auth_user_created trigger.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, country")
    .eq("id", user.id)
    .maybeSingle();

  // Fall back to the email's local-part if no display name set
  const displayName =
    profile?.display_name ??
    user.email?.split("@")[0] ??
    "trader";

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <DashboardNav displayName={displayName} email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
