// components/dashboard/DashboardNav.tsx
import Link from "next/link";
import { LogOut, LayoutGrid } from "lucide-react";

export default function DashboardNav({ userEmail }: { userEmail: string }) {
  return (
    <header className="border-b border-white/5 bg-black/20 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            T
          </div>
          <span className="font-serif text-lg italic tracking-tight">
            Trade<span className="text-blue-400">·</span>Journal
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard/accounts"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Accounts
          </Link>
          <div className="ml-2 hidden text-xs text-slate-500 md:block">
            {userEmail}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
