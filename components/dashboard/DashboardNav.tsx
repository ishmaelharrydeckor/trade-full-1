// components/dashboard/DashboardNav.tsx
import Link from "next/link";
import { LogOut, LayoutGrid, Users } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function DashboardNav({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--nav-bg)' }}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20">
            T
          </div>
          <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Trade<span style={{ color: 'var(--accent-blue)' }}>·</span>Journal
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition sm:inline-flex"
            style={{ color: 'var(--text-secondary)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/accounts"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition sm:inline-flex"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Accounts
          </Link>
          <Link
            href="/dashboard/mentoring"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition sm:inline-flex"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Users className="h-3.5 w-3.5" />
            Mentoring
          </Link>

          <div className="mx-2 hidden h-5 w-px md:block" style={{ backgroundColor: 'var(--border-panel)' }} />

          <ThemeToggle className="hidden sm:inline-flex" />

          <div className="mx-2 hidden h-5 w-px md:block" style={{ backgroundColor: 'var(--border-panel)' }} />

          <div
            className="ml-1 hidden text-right md:block"
            title={email}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{email}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
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
