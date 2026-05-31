// app/dashboard/accounts/new/page.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CreateAccountForm from "@/components/dashboard/CreateAccountForm";

export default function NewAccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/dashboard/accounts"
        className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to accounts
      </Link>
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">New account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create a trading account. You can connect MT5 to it in the next
          step, or use CSV import.
        </p>
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <CreateAccountForm />
      </div>
    </div>
  );
}
