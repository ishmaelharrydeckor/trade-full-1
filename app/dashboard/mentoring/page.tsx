import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MentorDashboard from "@/components/mentor/MentorDashboard";

export default async function MentoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all accounts for creating invites
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, broker, currency")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">Mentoring</h1>
        <p className="mt-2 text-sm text-slate-400">
          Share your trading accounts with a mentor for feedback, or view your students&apos; progress.
        </p>
      </header>
      <MentorDashboard userId={user.id} accounts={(accounts ?? []) as never[]} />
    </div>
  );
}
