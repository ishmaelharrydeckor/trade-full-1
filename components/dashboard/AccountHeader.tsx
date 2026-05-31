// components/dashboard/AccountHeader.tsx
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
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
        className="inline-flex w-fit items-center gap-1 text-xs text-slate-400 transition hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All accounts
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
            {account.name}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {account.broker ?? "—"}
            {account.account_number ? ` · ${account.account_number}` : ""}{" "}
            · <span className="font-mono">{account.currency}</span>
            {account.starting_balance != null && (
              <>
                {" · "}
                Starting:{" "}
                <span className="tabular-nums text-slate-300">
                  {account.currency}{" "}
                  {Number(account.starting_balance).toFixed(2)}
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href={`/dashboard/accounts/${account.id}/settings`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
          title="Account settings"
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
      </div>
    </header>
  );
}
