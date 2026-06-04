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
    .select("display_name, country")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Profile Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your personal profile and display settings.
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          border: "1px solid var(--app-border)",
          backgroundColor: "var(--app-surface)",
        }}
      >
        <ProfileFormClient
          email={user.email ?? ""}
          initialDisplayName={profile?.display_name ?? ""}
          initialCountry={profile?.country ?? ""}
        />
      </div>
    </div>
  );
}
