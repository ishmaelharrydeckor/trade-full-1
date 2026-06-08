// app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Terms of Use — Trade·Journal",
  description: "The rules and conditions for using Trade·Journal.",
};

export default function TermsOfUsePage() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="ambient-bg min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 md:px-12 border-b" style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--nav-bg)' }}>
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="relative h-7 w-7 sm:h-8 sm:w-8">
            <Image
              src="/logo.png"
              alt="Trade·Journal Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="text-base font-bold tracking-tight sm:text-xl text-[color:var(--text-primary)]">
            Trade<span className="text-emerald-500">·</span>Journal
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[700px] mx-auto px-6 py-12 md:py-20">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight text-[color:var(--text-primary)]">
          Terms of Use
        </h1>
        <p className="mt-3 text-base font-medium text-[color:var(--text-secondary)]">
          The rules and conditions for using Trade·Journal.
        </p>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Last updated: {today}
        </p>

        <div className="mt-12 space-y-10 text-[color:var(--text-primary)] leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              1. Acceptance
            </h2>
            <p>
              By using Trade·Journal, you agree to these Terms of Use. If you do not agree to all of these terms, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              2. Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate and complete information when signing up for the service.</li>
            </ul>
          </section>

          {/* Trading Disclaimer Section (Prominent Styling) */}
          <section 
            className="rounded-2xl p-6 border-l-4" 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: '#10b981', // Emerald green
              borderWidth: '1px 1px 1px 4px'
            }}
          >
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              3. Trading Disclaimer
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                <strong>IMPORTANT:</strong> Trade·Journal is a journaling, reflection, and metrics analytics tool.
              </p>
              <p>
                We do not provide financial advice, investment advice, trading recommendations, or trade signals of any kind.
              </p>
              <p>
                We do not guarantee profits, specific system outcomes, or consistent returns. All trading decisions are made solely by you.
              </p>
              <p className="font-semibold">
                We are not responsible for any financial losses incurred from your live trading.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              4. Your Content
            </h2>
            <p className="mb-3">
              You retain full ownership of all trades, journal entries, logs, screenshots, and notes that you record on Trade·Journal.
            </p>
            <p>
              You grant us a limited, worldwide license to store, process, and display your data solely for the purpose of operating, maintaining, and presenting the service to you. We do not claim any ownership of your data.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              5. Prohibited Uses
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You may not use the service for any illegal activities or violations of local regulations.</li>
              <li>You may not engage in abuse, harassment, or malicious actions against the service or other users.</li>
              <li>You may not reverse engineer, scrape, crawl, or attempt unauthorized access to the service or database layers.</li>
              <li>You may not share your account or access credentials with other individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              6. Service Availability
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The service is provided on an &ldquo;as is&rdquo; basis.</li>
              <li>We may add, modify, or remove features over time as the platform is refined.</li>
              <li>Beta features may change, be paused, or be removed completely without notice.</li>
              <li>While we aim for high uptime and platform reliability, we cannot guarantee zero downtime.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              7. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Trade·Journal and its team are not liable for any indirect, incidental, special, or consequential damages. This includes, without limitation, lost profits, live trading losses, data loss, or system downtime.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              8. Changes to These Terms
            </h2>
            <p>
              We may update these terms as the product evolves. Your continued use of the service after terms are modified constitutes full acceptance of the updated terms.
            </p>
          </section>

          <section className="pt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              9. Contact
            </h2>
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:scale-[1.02]"
                style={{ minHeight: "44px" }}
              >
                Contact us
              </Link>
              <p className="text-xs text-[color:var(--text-muted)]">
                Questions about these terms? Get in touch.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer 
        className="px-6 py-12 border-t text-xs md:px-12 mt-auto" 
        style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)', backgroundColor: 'var(--nav-bg)' }}
      >
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-8 text-left">
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image
                  src="/logo.png"
                  alt="Trade·Journal Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Trade<span className="text-emerald-500">·</span>Journal
              </span>
            </div>
            <p className="text-xs text-[color:var(--text-secondary)]">
              Build self-awareness. Master your mind. Excel at trade execution.
            </p>
            <p className="text-[10px]">&copy; {new Date().getFullYear()} Trade·Journal. All rights reserved. Built in Ghana 🇬🇭</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Resources</h3>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/privacy-policy" 
                    className="inline-flex items-center hover:text-white transition-colors duration-150 py-2"
                    style={{ minHeight: "44px" }}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="inline-flex items-center hover:text-white transition-colors duration-150 py-2"
                    style={{ minHeight: "44px" }}
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center hover:text-white transition-colors duration-150 py-2"
                    style={{ minHeight: "44px" }}
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://www.tradejernal.com/beta-feedback" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-150 py-2"
                    style={{ minHeight: "44px" }}
                  >
                    Beta Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
