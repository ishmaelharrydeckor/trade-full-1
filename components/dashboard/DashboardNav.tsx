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
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--app-border)",
        backgroundColor: "var(--nav-bg)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold shadow-lg"
            style={{
              background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))',
              color: '#fff',
              boxShadow: '0 10px 15px -3px var(--accent-glow)',
            }}
          >
            T
          </div>
          <span
            className="text-lg font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Trade
            <span style={{ color: "var(--accent)" }}>·</span>
            Journal
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="nav-item hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/accounts"
            className="nav-item hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm sm:inline-flex"
          >
            <LayoutGrid className="h-3.5 w-3.5 opacity-70" />
            Accounts
          </Link>
          <Link
            href="/dashboard/mentoring"
            className="nav-item hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm sm:inline-flex"
          >
            <Users className="h-3.5 w-3.5 opacity-70" />
            Mentoring
          </Link>

          <div
            className="mx-2 hidden h-5 w-px md:block"
            style={{ backgroundColor: "var(--app-border)" }}
          />

          <ThemeToggle className="hidden sm:inline-flex" />

          <div
            className="mx-2 hidden h-5 w-px md:block"
            style={{ backgroundColor: "var(--app-border)" }}
          />

          <div className="ml-1 hidden text-right md:block" title={email}>
            <div
              className="text-xs font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </div>
            <div
              className="text-[10px] font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {email}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
