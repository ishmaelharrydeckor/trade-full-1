"use client";

import { useState, type FormEvent } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRADING_DURATION_OPTIONS = [
  "Less than 6 months",
  "6-12 months",
  "1-2 years",
  "2-5 years",
  "5+ years",
];

const WHAT_DO_YOU_TRADE = [
  "Forex",
  "Crypto",
  "Indices",
  "Stocks",
  "Commodities",
  "Other",
];

const PLATFORM_OPTIONS = [
  "MetaTrader 5",
  "MetaTrader 4",
  "cTrader",
  "TradingView",
  "Other",
];

const HEAR_ABOUT_OPTIONS = [
  "Twitter/X",
  "WhatsApp group",
  "Telegram",
  "TradingView",
  "Friend/mentor",
  "Other",
];

const FEATURES_USED = [
  "Trade logging",
  "CSV import",
  "MT5 auto-sync",
  "Analytics",
  "AI Insights",
  "Backtester",
  "Playbook",
  "Notebook",
  "Progress tracker",
  "Calendar",
  "Position calculator",
  "None yet",
];

const MAX_PRICE_OPTIONS = ["$0", "$5", "$10", "$15", "$20", "$25+"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BetaFeedbackForm() {
  // Section 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tradingDuration, setTradingDuration] = useState("");
  const [whatYouTrade, setWhatYouTrade] = useState<string[]>([]);
  const [broker, setBroker] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Section 2
  const [hearAbout, setHearAbout] = useState("");
  const [hasAccount, setHasAccount] = useState("");
  const [featuresUsed, setFeaturesUsed] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [impressedFeature, setImpressedFeature] = useState("");
  const [frustratedFeature, setFrustratedFeature] = useState("");

  // Section 3
  const [wouldPay, setWouldPay] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wishedFeature, setWishedFeature] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [otherFeedback, setOtherFeedback] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Helpers
  function toggleCheckbox(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    // Validate name (letters, spaces, hyphens, apostrophes only, min 2 chars)
    const nameRegex = /^[A-Za-zÀ-ÿ\s'\-]{2,}$/;
    if (!nameRegex.test(fullName.trim())) {
      setErrorMsg("Please enter a valid name (letters and spaces only, minimum 2 characters).");
      setSubmitting(false);
      return;
    }

    // Validate WhatsApp (if provided, only digits and standard phone symbols, min 7 chars)
    if (whatsapp.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(whatsapp.trim())) {
        setErrorMsg("Please enter a valid WhatsApp phone number (numbers, spaces, and symbols like +, -, () only).");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      full_name: fullName,
      email,
      whatsapp: whatsapp || null,
      trading_duration: tradingDuration,
      what_you_trade: whatYouTrade,
      broker: broker || null,
      platforms,
      hear_about: hearAbout,
      has_account: hasAccount,
      features_used: featuresUsed,
      rating,
      impressed_feature: impressedFeature,
      frustrated_feature: frustratedFeature,
      would_pay: wouldPay,
      max_price: maxPrice,
      wished_feature: wishedFeature,
      would_recommend: wouldRecommend,
      other_feedback: otherFeedback || null,
      submitted_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Network error — please retry.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (submitted) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          backgroundColor: "var(--app-surface)",
          border: "1px solid var(--app-border)",
        }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
          <svg
            className="h-8 w-8"
            style={{ color: "var(--positive)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2
          className="font-serif text-2xl tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Thank you!
        </h2>
        <p
          className="mx-auto mt-3 max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Thanks for your feedback! You&apos;re helping build the best trading
          journal in Africa. 🚀
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ============================================================
          SECTION 1 — About You
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8"
        style={{
          backgroundColor: "var(--app-surface)",
          border: "1px solid var(--app-border)",
        }}
      >
        <legend
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          About You
        </legend>

        {/* Full name */}
        <Label htmlFor="fullName">
          Full name <Req />
        </Label>
        <input
          id="fullName"
          type="text"
          required
          pattern="^[A-Za-zÀ-ÿ\s'\-]{2,}$"
          title="Please enter a valid name (letters and spaces only, minimum 2 characters)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Kwame Mensah"
          className="tj-input mb-5 w-full"
        />

        {/* Email */}
        <Label htmlFor="email">
          Email <Req />
        </Label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="tj-input mb-5 w-full"
        />

        {/* WhatsApp */}
        <Label htmlFor="whatsapp">WhatsApp number (optional)</Label>
        <input
          id="whatsapp"
          type="tel"
          pattern="^\+?[0-9\s\-()]{7,20}$"
          title="Please enter a valid WhatsApp phone number (numbers, spaces, and symbols like +, -, () only, 7-20 digits)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+233 24 000 0000"
          className="tj-input mb-5 w-full"
        />

        {/* Trading duration */}
        <Label htmlFor="tradingDuration">
          How long have you been trading? <Req />
        </Label>
        <select
          id="tradingDuration"
          required
          value={tradingDuration}
          onChange={(e) => setTradingDuration(e.target.value)}
          className="tj-input mb-5 w-full"
        >
          <option value="" disabled>
            Select…
          </option>
          {TRADING_DURATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* What you trade */}
        <Label>
          What do you trade? <Req />
        </Label>
        <CheckboxGroup
          options={WHAT_DO_YOU_TRADE}
          selected={whatYouTrade}
          onChange={(v) => toggleCheckbox(v, whatYouTrade, setWhatYouTrade)}
        />

        {/* Broker */}
        <Label htmlFor="broker">What broker do you use? (optional)</Label>
        <input
          id="broker"
          type="text"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
          placeholder="e.g. Exness, Deriv, IC Markets"
          className="tj-input mb-5 w-full"
        />

        {/* Platform */}
        <Label>What platform?</Label>
        <CheckboxGroup
          options={PLATFORM_OPTIONS}
          selected={platforms}
          onChange={(v) => toggleCheckbox(v, platforms, setPlatforms)}
        />
      </fieldset>

      {/* ============================================================
          SECTION 2 — Your Experience
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8"
        style={{
          backgroundColor: "var(--app-surface)",
          border: "1px solid var(--app-border)",
        }}
      >
        <legend
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          Your Experience with Trade·Journal
        </legend>

        {/* How did you hear */}
        <Label htmlFor="hearAbout">
          How did you hear about Trade·Journal? <Req />
        </Label>
        <select
          id="hearAbout"
          required
          value={hearAbout}
          onChange={(e) => setHearAbout(e.target.value)}
          className="tj-input mb-5 w-full"
        >
          <option value="" disabled>
            Select…
          </option>
          {HEAR_ABOUT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* Has account */}
        <Label>
          Have you created an account? <Req />
        </Label>
        <RadioGroup
          name="hasAccount"
          options={["Yes", "No, just browsing"]}
          selected={hasAccount}
          onChange={setHasAccount}
        />

        {/* Features used — only show if has account */}
        {hasAccount === "Yes" && (
          <>
            <Label>Which features have you used?</Label>
            <CheckboxGroup
              options={FEATURES_USED}
              selected={featuresUsed}
              onChange={(v) =>
                toggleCheckbox(v, featuresUsed, setFeaturesUsed)
              }
            />
          </>
        )}

        {/* Star rating */}
        <Label>
          Rate your overall experience <Req />
        </Label>
        <div className="mb-5 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill={
                  star <= (hoverRating || rating)
                    ? "var(--warning)"
                    : "none"
                }
                stroke={
                  star <= (hoverRating || rating)
                    ? "var(--warning)"
                    : "var(--app-muted)"
                }
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Most impressive feature */}
        <Label htmlFor="impressedFeature">
          What&apos;s the ONE feature that impressed you most? <Req />
        </Label>
        <textarea
          id="impressedFeature"
          required
          rows={3}
          value={impressedFeature}
          onChange={(e) => setImpressedFeature(e.target.value)}
          placeholder="Tell us what stood out…"
          className="tj-input mb-5 w-full resize-none"
        />

        {/* Most frustrating thing */}
        <Label htmlFor="frustratedFeature">
          What&apos;s the ONE thing that frustrated or confused you? <Req />
        </Label>
        <textarea
          id="frustratedFeature"
          required
          rows={3}
          value={frustratedFeature}
          onChange={(e) => setFrustratedFeature(e.target.value)}
          placeholder="Be honest — it helps us improve"
          className="tj-input mb-5 w-full resize-none"
        />
      </fieldset>

      {/* ============================================================
          SECTION 3 — What Would Make You Stay
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8"
        style={{
          backgroundColor: "var(--app-surface)",
          border: "1px solid var(--app-border)",
        }}
      >
        <legend
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          What Would Make You Stay
        </legend>

        {/* Would pay */}
        <Label>
          Would you pay for this tool? <Req />
        </Label>
        <RadioGroup
          name="wouldPay"
          options={[
            "Yes, definitely",
            "Maybe, depends on price",
            "No, only if free",
          ]}
          selected={wouldPay}
          onChange={setWouldPay}
        />

        {/* Max price */}
        <Label htmlFor="maxPrice">
          What&apos;s the maximum you&apos;d pay per month? <Req />
        </Label>
        <select
          id="maxPrice"
          required
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="tj-input mb-5 w-full"
        >
          <option value="" disabled>
            Select…
          </option>
          {MAX_PRICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* Wished feature */}
        <Label htmlFor="wishedFeature">
          What&apos;s the #1 feature you wish existed? <Req />
        </Label>
        <textarea
          id="wishedFeature"
          required
          rows={3}
          value={wishedFeature}
          onChange={(e) => setWishedFeature(e.target.value)}
          placeholder="Describe your dream feature…"
          className="tj-input mb-5 w-full resize-none"
        />

        {/* Would recommend */}
        <Label>
          Would you recommend Trade·Journal to your trading group? <Req />
        </Label>
        <RadioGroup
          name="wouldRecommend"
          options={["Yes", "Maybe", "No"]}
          selected={wouldRecommend}
          onChange={setWouldRecommend}
        />

        {/* Any other feedback */}
        <Label htmlFor="otherFeedback">Any other feedback? (optional)</Label>
        <textarea
          id="otherFeedback"
          rows={3}
          value={otherFeedback}
          onChange={(e) => setOtherFeedback(e.target.value)}
          placeholder="Anything else you'd like us to know…"
          className="tj-input mb-2 w-full resize-none"
        />
      </fieldset>

      {/* ============================================================
          SUBMIT
          ============================================================ */}
      {errorMsg && (
        <p
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--negative)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/40 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components (kept in the same file for simplicity)
// ---------------------------------------------------------------------------

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium"
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </label>
  );
}

function Req() {
  return (
    <span className="ml-0.5" style={{ color: "var(--negative)" }}>
      *
    </span>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
            style={{
              backgroundColor: active
                ? "var(--accent-glow)"
                : "var(--app-elevated)",
              border: active
                ? "1px solid var(--accent)"
                : "1px solid var(--app-border)",
              color: active ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioGroup({
  name,
  options,
  selected,
  onChange,
}: {
  name: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <label
            key={opt}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition"
            style={{
              backgroundColor: active
                ? "var(--accent-glow)"
                : "var(--app-elevated)",
              border: active
                ? "1px solid var(--accent)"
                : "1px solid var(--app-border)",
              color: active ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={active}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}
