// app/dashboard/profile/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileFormClient from "@/components/dashboard/ProfileFormClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Profile Settings</h1>
          <p className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Manage your personal speculative identity
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f1318]/50 backdrop-blur-md p-8 shadow-2xl">
          <ProfileFormClient
            email={user.email ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
            initialCountry={profile?.country ?? ""}
            initialTimezone={profile?.timezone ?? "UTC"}
          />
        </div>
      </div>
    </div>
  );
}

