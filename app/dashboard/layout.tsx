// app/dashboard/layout.tsx
// Protected layout. Middleware enforces auth, but we also fetch the user
// here for the nav so the email displays.

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

  return (
    <div className="min-h-screen bg-[color:var(--bg-app)]">
      <DashboardNav userEmail={user.email ?? "user"} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
