// components/dashboard/DashboardNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutGrid, Award, User, Menu, X, MessageSquare } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function DashboardNav({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--border-panel)",
        backgroundColor: "var(--nav-bg)",
        height: "72px",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Trade·Journal Logo"
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

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/accounts"
            className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
          >
            <LayoutGrid className="h-3.5 w-3.5 opacity-70" />
            Accounts
          </Link>
          <Link
            href="/dashboard/mentoring"
            className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
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
            className="mx-2 hidden md:block h-5 w-px"
            style={{ backgroundColor: "var(--border-panel)" }}
          />

          <ThemeToggle className="inline-flex" />

          <div
            className="mx-2 hidden md:block h-5 w-px"
            style={{ backgroundColor: "var(--border-panel)" }}
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

          <form action="/auth/signout" method="post" className="inline-flex">
            <button
              type="submit"
              className="nav-item inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
              title="Sign out"
              style={{ minHeight: "44px" }}
            >
              <LogOut className="h-3.5 w-3.5 opacity-70" />
              <span>Sign out</span>
            </button>
          </form>
        </nav>

        {/* Mobile Controls (Hamburger & Theme Toggle) */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle className="inline-flex" />
          <button
            type="button"
            onClick={toggleDrawer}
            aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-150"
            style={{
              minHeight: "44px",
              minWidth: "44px",
              color: "var(--text-primary)",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border-panel)",
            }}
          >
            {isDrawerOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-x-0 top-[72px] bottom-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden flex justify-end"
          onClick={toggleDrawer}
        >
          <div
            className="w-64 h-full flex flex-col p-6 border-l animate-in slide-in-from-right duration-200"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border-panel)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                Navigation
              </span>

              <Link
                href="/dashboard"
                onClick={toggleDrawer}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                style={{ color: "var(--text-primary)", minHeight: "44px" }}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/accounts"
                onClick={toggleDrawer}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                style={{ color: "var(--text-primary)", minHeight: "44px" }}
              >
                <LayoutGrid className="h-4 w-4 opacity-75" />
                Accounts
              </Link>
              <Link
                href="/dashboard/mentoring"
                onClick={toggleDrawer}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                style={{ color: "var(--text-primary)", minHeight: "44px" }}
              >
                <Award className="h-4 w-4 opacity-75" />
                Coach
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={toggleDrawer}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                style={{ color: "var(--text-primary)", minHeight: "44px" }}
              >
                <User className="h-4 w-4 opacity-75" />
                Profile
              </Link>

              <hr className="border-t my-2" style={{ borderColor: "var(--border-panel)" }} />

              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                Feedback
              </span>
              <a
                href="https://www.tradejernal.com/beta-feedback"
                target="_blank"
                rel="noopener noreferrer"
                onClick={toggleDrawer}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all hover:bg-white/5"
                style={{ minHeight: "44px" }}
              >
                <MessageSquare className="h-4 w-4" />
                Give Feedback
              </a>
            </div>

            <div className="mt-auto border-t pt-4" style={{ borderColor: "var(--border-panel)" }}>
              <div className="px-3 mb-4">
                <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {displayName}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                  {email}
                </p>
              </div>

              <form action="/auth/signout" method="post" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 transition-all"
                  style={{ minHeight: "44px" }}
                >
                  <LogOut className="h-4 w-4 opacity-75" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
