// app/privacy-policy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Privacy Policy — Trade·Journal",
  description: "How Trade·Journal collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-base font-medium text-[color:var(--text-secondary)]">
          How Trade·Journal collects, uses, and protects your information.
        </p>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Last updated: {today}
        </p>

        <div className="mt-12 space-y-10 text-[color:var(--text-primary)] leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              1. Introduction
            </h2>
            <p>
              Trade·Journal is a discipline-focused trading journal built in Ghana. We take your privacy seriously. This policy explains what information we collect, how we use it, and your rights regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account information:</strong> Your name, email address, and hashed password.</li>
              <li><strong>Trade data:</strong> Detailed records of the trades you log, journal entries, habit tracking, and screenshots or attachments you upload.</li>
              <li><strong>Usage data:</strong> Information about how you interact with the application, including page views, feature usage logs, and interface interactions.</li>
              <li><strong>Technical data:</strong> Your web browser type, device details, IP address, and session information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              3. How We Use Information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, operate, and maintain the Trade·Journal service.</li>
              <li>To improve and optimize the product based on aggregate usage patterns and analytics.</li>
              <li>To respond to customer support requests and assist with execution questions.</li>
              <li>To send transactional and account emails (such as signup confirmation, password resets, and security updates).</li>
              <li>To detect, prevent, and address technical or security vulnerabilities.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              4. Data Storage and Security
            </h2>
            <p className="mb-3">
              Your data is stored on highly secure, encrypted infrastructure provided by Supabase, hosted in EU regions.
            </p>
            <p className="mb-3">
              All connections to our platform use standard HTTPS encryption. We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
            <p>
              Your trade data is private to your account. It is only visible to you and any mentor you explicitly and voluntarily choose to share it with.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              5. Third-Party Services
            </h2>
            <p className="mb-3">We utilize selected third-party service providers to run parts of our operations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase:</strong> For database hosting and account authentication services.</li>
              <li><strong>Vercel:</strong> For web application hosting.</li>
              <li><strong>Resend:</strong> For transactional email delivery.</li>
              <li><strong>Google Gemini:</strong> For providing AI insights. Only trade data you log is processed; no personally identifying information is sent to the AI service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              6. Your Rights
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can export your trade data at any time from your account settings page.</li>
              <li>You can request complete deletion of your account and all associated trade data by emailing <a href="mailto:hello@tradejernal.com" className="text-emerald-500 hover:underline">hello@tradejernal.com</a>.</li>
              <li>You can update or correct your account information directly inside your profile settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy as our product evolves and new features are added. Material changes will be communicated via email or through prominent in-app notices.
            </p>
          </section>

          <section className="pt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4 text-[color:var(--text-primary)]">
              8. Contact
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
                Questions about this policy? We read every message.
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
