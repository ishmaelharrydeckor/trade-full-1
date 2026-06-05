// app/beta-feedback/page.tsx
// Public beta-tester feedback form — no authentication required.

import type { Metadata } from "next";
import BetaFeedbackForm from "@/components/beta/BetaFeedbackForm";

export const metadata: Metadata = {
  title: "Beta Feedback — Trade·Journal",
  description:
    "Help us build the best trading journal in Africa. Share your feedback as a Trade·Journal beta tester.",
};

export default function BetaFeedbackPage() {
  return (
    <main className="ambient-bg min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
            T
          </div>
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Trade
            <span style={{ color: "var(--accent)" }}>·</span>Journal
          </span>
        </div>
      </header>

      {/* Page heading */}
      <section className="mx-auto max-w-2xl px-6 pb-4 text-center">
        <h1
          className="font-serif text-4xl leading-tight tracking-tight md:text-5xl"
          style={{ color: "var(--text-primary)" }}
        >
          Beta Tester Feedback
        </h1>
        <p
          className="mx-auto mt-4 max-w-lg text-base leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Your honest feedback shapes what gets built next.
          <br />
          Takes about 4 minutes. Only email is required — everything else is optional.
        </p>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-2xl px-6 pb-20 pt-6">
        <BetaFeedbackForm />
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{
          borderTop: "1px solid var(--card-border)",
          color: "var(--text-muted)",
        }}
      >
        <p>Built in Ghana 🇬🇭</p>
      </footer>
    </main>
  );
}
