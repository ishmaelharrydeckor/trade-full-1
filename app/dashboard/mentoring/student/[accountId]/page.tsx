import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StudentView from "@/components/mentor/StudentView";

export default async function StudentAccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/dashboard/mentoring"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to mentoring
      </Link>
      <StudentView accountId={accountId} />
    </div>
  );
}
