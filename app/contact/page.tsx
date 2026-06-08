// app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Trade·Journal",
  description: "Get in touch with the Trade·Journal team.",
};

export default function ContactPage() {
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
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight text-[color:var(--text-primary)]">
            Get in touch
          </h1>
          <p className="mt-4 text-base md:text-lg text-[color:var(--text-secondary)] leading-relaxed">
            We read every message. Bug reports, feature ideas, trading workflow questions, or just to say hi — we want to hear from you.
          </p>
        </div>

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Contact Details Card */}
          <div 
            className="lg:col-span-5 rounded-2xl p-6 md:p-8 space-y-6"
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400 mb-2">
                📧 Email
              </h3>
              <p className="text-sm md:text-base font-medium">
                <a href="mailto:hello@tradejernal.com" className="text-[color:var(--text-primary)] hover:underline">
                  hello@tradejernal.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400 mb-2">
                🇬🇭 Based in Ghana
              </h3>
              <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
                Trade·Journal is built by a small team in Ghana for traders worldwide.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400 mb-2">
                ⏱️ Response time
              </h3>
              <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
                We typically respond within 24-48 hours.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-7">
            <div 
              className="rounded-2xl p-6 md:p-8"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <ContactForm />
            </div>
          </div>
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
