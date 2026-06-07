// components/dashboard/DashboardNav.tsx
import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutGrid, Award, User } from "lucide-react";
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
        height: "72px",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="TradeJernal Logo"
            width={28}
            height={28}
            priority
            className="object-contain"
          />
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
            <Award className="h-3.5 w-3.5 opacity-70" />
            Coach
          </Link>
          <Link
            href="/dashboard/profile"
            className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
          >
            <User className="h-3.5 w-3.5 opacity-70" />
            Profile
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

          <Link
            href="/dashboard/profile"
            className="ml-1 hidden text-right md:block hover:opacity-80 transition duration-150"
            title="Edit Profile"
          >
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
          </Link>
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
