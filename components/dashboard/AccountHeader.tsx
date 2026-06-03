// components/dashboard/AccountHeader.tsx
import Link from "next/link";
import { ChevronLeft, Settings, PlayCircle } from "lucide-react";
import type { Account } from "@/types/database";

export default function AccountHeader({
  account,
}: {
  account: Pick<
    Account,
    "id" | "name" | "broker" | "account_number" | "currency" | "starting_balance"
  >;
}) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium transition duration-150"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All accounts
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl" style={{ color: 'var(--text-primary)' }}>
            {account.name}
          </h1>
          <p className="mt-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {account.broker ?? "—"}
            {account.account_number ? ` · ${account.account_number}` : ""}{" "}
            · <span className="font-mono">{account.currency}</span>
            {account.starting_balance != null && (
              <>
                {" · "}
                Starting:{" "}
                <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {account.currency}{" "}
                  {Number(account.starting_balance).toFixed(2)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/accounts/${account.id}/backtest`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition duration-150"
            style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
            title="Open the backtester"
          >
            <PlayCircle className="h-3.5 w-3.5" /> Backtester
          </Link>
          <Link
            href={`/dashboard/accounts/${account.id}/settings`}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition duration-150"
            style={{ borderColor: 'var(--app-border)', color: 'var(--text-secondary)' }}
            title="Account settings"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
