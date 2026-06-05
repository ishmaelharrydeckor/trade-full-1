// components/auth/AuthShell.tsx
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            T
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Trade<span style={{ color: 'var(--accent-blue)' }}>·</span>Jernal
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-4xl tracking-tight md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>

          <div
            className="rounded-2xl p-6 backdrop-blur md:p-8"
            style={{
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--card-bg)',
            }}
          >
            {children}
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            {altText}{" "}
            <Link
              href={altHref}
              className="underline-offset-4 hover:underline"
              style={{ color: 'var(--accent-blue)' }}
            >
              {altLabel}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
