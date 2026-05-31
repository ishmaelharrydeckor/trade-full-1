// components/auth/AuthShell.tsx
import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
  altText,
  altHref,
  altLabel,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  altText: string;
  altHref: string;
  altLabel: string;
}) {
  return (
    <main className="ambient-bg flex min-h-screen flex-col">
      <header className="px-6 py-6 md:px-12">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            T
          </div>
          <span className="font-serif text-xl italic tracking-tight">
            Trade<span className="text-blue-400">·</span>Journal
          </span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur md:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            {altText}{" "}
            <Link
              href={altHref}
              className="text-blue-400 underline-offset-4 hover:underline"
            >
              {altLabel}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
