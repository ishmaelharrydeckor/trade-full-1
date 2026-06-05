"use client";

import { useState, type FormEvent } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOGGED_TRADES_OPTIONS = [
  { value: "yes_several", label: "Yes, several" },
  { value: "yes_few", label: "Yes, just a few" },
  { value: "stuck", label: "I tried but got stuck" },
  { value: "browsed", label: "No, just browsed" },
];

const PREVIOUS_TRACKING_OPTIONS = [
  { value: "excel", label: "Excel or Google Sheets" },
  { value: "notebook", label: "A notebook (paper)" },
  { value: "nothing", label: "Nothing — I didn't track" },
  { value: "another_app", label: "Another app (Which one?)" },
  { value: "other", label: "Other (Tell us more)" },
];

const FEATURES_USED_OPTIONS = [
  { value: "manual", label: "Trade journal — logging trades manually" },
  { value: "csv", label: "CSV import" },
  { value: "mt5_sync", label: "MT5 live sync" },
  { value: "analytics", label: "Analytics dashboard (KPIs, equity curve)" },
  { value: "calendar", label: "P&L Calendar" },
  { value: "ai_insights", label: "AI Insights" },
  { value: "backtester", label: "Backtester" },
  { value: "none", label: "I didn't really use anything yet" },
];

const SEAN_ELLIS_OPTIONS = [
  { value: "very", label: "Very disappointed" },
  { value: "somewhat", label: "Somewhat disappointed" },
  { value: "not", label: "Not disappointed" },
  { value: "not_using", label: "I'm not using it" },
];

const RECOMMEND_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
  { value: "later", label: "Not yet, but ask me again later" },
];

const TRADING_EXPERIENCE_OPTIONS = [
  "Less than 6 months",
  "6-12 months",
  "1-2 years",
  "2-5 years",
  "5+ years",
  "Prefer not to say",
];

const WHAT_THEY_TRADE_OPTIONS = [
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
  "Prefer not to say",
];

const HEARD_FROM_OPTIONS = [
  "Friend or mentor",
  "Twitter/X",
  "WhatsApp group",
  "Telegram",
  "TradingView",
  "KNUST or campus",
  "Other",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BetaFeedbackForm() {
  // Block 1 — Identifier
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Block 2 — Experience
  const [loggedTrades, setLoggedTrades] = useState("");
  const [previousTracking, setPreviousTracking] = useState("");
  const [previousTrackingOther, setPreviousTrackingOther] = useState("");
  const [featuresUsed, setFeaturesUsed] = useState<string[]>([]);
  const [whatFrustrated, setWhatFrustrated] = useState("");
  const [whatWasMissing, setWhatWasMissing] = useState("");

  // Block 3 — The PMF signal
  const [seanEllisScore, setSeanEllisScore] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  // Block 4 — Optional details
  const [fullName, setFullName] = useState("");
  const [tradingExperience, setTradingExperience] = useState("");
  const [whatTheyTrade, setWhatTheyTrade] = useState<string[]>([]);
  const [broker, setBroker] = useState("");
  const [platform, setPlatform] = useState("");
  const [heardFrom, setHeardFrom] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Helpers
  function toggleCheckbox(value: string, list: string[], setter: (v: string[]) => void) {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    // Client-side validations
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      setSubmitting(false);
      return;
    }

    if (whatsapp.trim()) {
      const cleanPhone = whatsapp.replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        setErrorMsg("WhatsApp number must contain at least 9 digits.");
        setSubmitting(false);
        return;
      }
    }

    if (!loggedTrades) {
      setErrorMsg("Please answer: Did you log any trades?");
      setSubmitting(false);
      return;
    }

    if (!previousTracking) {
      setErrorMsg("Please answer what you were using to track trades before this.");
      setSubmitting(false);
      return;
    }

    if (featuresUsed.length === 0) {
      setErrorMsg("Please select at least one feature you actually used.");
      setSubmitting(false);
      return;
    }

    if (!seanEllisScore) {
      setErrorMsg("Please answer how you would feel if Trade·Jernal stopped working tomorrow.");
      setSubmitting(false);
      return;
    }

    if (!wouldRecommend) {
      setErrorMsg("Please answer if you would recommend Trade·Jernal.");
      setSubmitting(false);
      return;
    }

    // Length limit checks
    if (whatFrustrated.length > 1000) {
      setErrorMsg("Confused/frustrated answer exceeds 1000 characters limit.");
      setSubmitting(false);
      return;
    }
    if (whatWasMissing.length > 1000) {
      setErrorMsg("Missing expectations answer exceeds 1000 characters limit.");
      setSubmitting(false);
      return;
    }
    if (anythingElse.length > 2000) {
      setErrorMsg("Anything else answer exceeds 2000 characters limit.");
      setSubmitting(false);
      return;
    }

    const payload = {
      email: email.trim(),
      whatsapp: whatsapp.trim() || null,
      logged_trades: loggedTrades,
      previous_tracking: previousTracking,
      previous_tracking_other: previousTrackingOther.trim() || null,
      features_used: featuresUsed,
      what_frustrated: whatFrustrated.trim() || null,
      what_was_missing: whatWasMissing.trim() || null,
      sean_ellis_score: seanEllisScore,
      would_recommend: wouldRecommend,
      anything_else: anythingElse.trim() || null,
      full_name: fullName.trim() || null,
      trading_experience: tradingExperience || null,
      what_they_trade: whatTheyTrade.length > 0 ? whatTheyTrade : null,
      broker: broker.trim() || null,
      platform: platform || null,
      heard_from: heardFrom || null,
    };

    try {
      const res = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Network error — please retry."
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
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl tracking-tight text-[color:var(--text-primary)]">
          ✅ Got it. Thank you.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--text-secondary)]">
          Your feedback has been recorded. If you left your WhatsApp, I might message you to dig deeper — only if your feedback raised something I want to understand better.
        </p>
        <div className="mt-6 text-xs text-[color:var(--text-muted)]">
          Built in Ghana 🇬🇭
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form View
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ============================================================
          BLOCK 1 — Identifier
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8 space-y-5"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent-blue)]">
          Block 1: Basic Info
        </legend>

        {/* Q1: Email */}
        <div>
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
            className="tj-input w-full"
          />
        </div>

        {/* Q2: WhatsApp */}
        <div>
          <Label htmlFor="whatsapp">WhatsApp number</Label>
          <p className="mb-2 text-xs text-[color:var(--text-muted)]">
            Optional — only if you&apos;re okay with a follow-up
          </p>
          <input
            id="whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+233 24 000 0000"
            className="tj-input w-full"
          />
        </div>
      </fieldset>

      {/* ============================================================
          BLOCK 2 — Your Experience
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent-blue)]">
          Block 2: Your Experience
        </legend>

        {/* Q3: Did you log trades */}
        <div>
          <Label>
            Did you log any trades? <Req />
          </Label>
          <RadioGroup
            name="loggedTrades"
            options={LOGGED_TRADES_OPTIONS}
            selected={loggedTrades}
            onChange={setLoggedTrades}
          />
        </div>

        {/* Q4: What were they using before */}
        <div>
          <Label>
            What were you using to track trades before this? <Req />
          </Label>
          <RadioGroup
            name="previousTracking"
            options={PREVIOUS_TRACKING_OPTIONS}
            selected={previousTracking}
            onChange={(val) => {
              setPreviousTracking(val);
              if (val !== "another_app" && val !== "other") {
                setPreviousTrackingOther("");
              }
            }}
          />
          {(previousTracking === "another_app" || previousTracking === "other") && (
            <div className="mt-3">
              <Label htmlFor="prevOther">
                {previousTracking === "another_app" ? "Which one?" : "Tell us more"} <Req />
              </Label>
              <input
                id="prevOther"
                type="text"
                required
                value={previousTrackingOther}
                onChange={(e) => setPreviousTrackingOther(e.target.value)}
                placeholder={previousTracking === "another_app" ? "e.g. MyFxBook, TradeZella" : "Provide details…"}
                className="tj-input w-full"
              />
            </div>
          )}
        </div>

        {/* Q5: What did they actually use */}
        <div>
          <Label>
            What did you actually USE? (check all that apply) <Req />
          </Label>
          <CheckboxGroup
            options={FEATURES_USED_OPTIONS}
            selected={featuresUsed}
            onChange={(val) => toggleCheckbox(val, featuresUsed, setFeaturesUsed)}
          />
        </div>

        {/* Q6: One thing that confused/frustrated */}
        <div>
          <Label htmlFor="whatFrustrated">What&apos;s the ONE thing that confused or frustrated you?</Label>
          <p className="mb-2 text-xs text-[color:var(--text-muted)]">Be specific. &quot;Nothing&quot; is a valid answer.</p>
          <textarea
            id="whatFrustrated"
            rows={3}
            maxLength={1000}
            value={whatFrustrated}
            onChange={(e) => setWhatFrustrated(e.target.value)}
            placeholder="Tell us honestly…"
            className="tj-input w-full resize-none"
          />
          <div className="text-right text-[10px] text-[color:var(--text-muted)] mt-1">
            {whatFrustrated.length}/1000
          </div>
        </div>

        {/* Q7: What did they think it would do that it doesn't */}
        <div>
          <Label htmlFor="whatWasMissing">What did you think it would do that it doesn&apos;t?</Label>
          <p className="mb-2 text-xs text-[color:var(--text-muted)]">Skip if nothing comes to mind.</p>
          <textarea
            id="whatWasMissing"
            rows={3}
            maxLength={1000}
            value={whatWasMissing}
            onChange={(e) => setWhatWasMissing(e.target.value)}
            placeholder="Features you expected to see…"
            className="tj-input w-full resize-none"
          />
          <div className="text-right text-[10px] text-[color:var(--text-muted)] mt-1">
            {whatWasMissing.length}/1000
          </div>
        </div>
      </fieldset>

      {/* ============================================================
          BLOCK 3 — PMF Signal
          ============================================================ */}
      <fieldset
        className="rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent-blue)]">
          Block 3: PMF & Recommendation
        </legend>

        {/* Q8: Sean Ellis PMF Question */}
        <div>
          <Label>
            How would you feel if Trade·Jernal stopped working tomorrow? <Req />
          </Label>
          <RadioGroup
            name="seanEllis"
            options={SEAN_ELLIS_OPTIONS}
            selected={seanEllisScore}
            onChange={setSeanEllisScore}
          />
        </div>

        {/* Q9: Would recommend */}
        <div>
          <Label>
            Would you recommend Trade·Jernal to a trader friend? <Req />
          </Label>
          <RadioGroup
            name="wouldRecommend"
            options={RECOMMEND_OPTIONS}
            selected={wouldRecommend}
            onChange={setWouldRecommend}
          />
        </div>

        {/* Q10: Anything else */}
        <div>
          <Label htmlFor="anythingElse">Anything else you want to share?</Label>
          <p className="mb-2 text-xs text-[color:var(--text-muted)]">Bugs, ideas, questions, kind words, harsh words — all welcome.</p>
          <textarea
            id="anythingElse"
            rows={4}
            maxLength={2000}
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            placeholder="Feedback, comments, features request…"
            className="tj-input w-full resize-none"
          />
          <div className="text-right text-[10px] text-[color:var(--text-muted)] mt-1">
            {anythingElse.length}/2000
          </div>
        </div>
      </fieldset>

      {/* ============================================================
          BLOCK 4 — Optional details (collapsed)
          ============================================================ */}
      <details className="group select-none rounded-2xl border bg-white/[0.01] transition duration-200" style={{ borderColor: 'var(--border-panel)' }}>
        <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-sm text-[color:var(--text-primary)] hover:text-white">
          <span>Tell us a bit about yourself (optional)</span>
          <span className="transition-transform duration-200 group-open:rotate-180">▼</span>
        </summary>

        <div className="border-t p-6 md:p-8 space-y-5 select-text" style={{ borderColor: 'var(--border-panel)' }}>
          {/* Q11: Name */}
          <div>
            <Label htmlFor="fullName">Your name</Label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Kwame Mensah"
              className="tj-input w-full"
            />
          </div>

          {/* Q12: Trading experience duration */}
          <div>
            <Label htmlFor="tradingExp">How long have you been trading?</Label>
            <select
              id="tradingExp"
              value={tradingExperience}
              onChange={(e) => setTradingExperience(e.target.value)}
              className="tj-input w-full"
            >
              <option value="">Select duration…</option>
              {TRADING_EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Q13: What they trade */}
          <div>
            <Label>What do you trade?</Label>
            <div className="flex flex-wrap gap-2">
              {WHAT_THEY_TRADE_OPTIONS.map((opt) => {
                const active = whatTheyTrade.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheckbox(opt, whatTheyTrade, setWhatTheyTrade)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition border"
                    style={{
                      backgroundColor: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
                      borderColor: active ? "var(--accent-blue)" : "var(--border-panel)",
                      color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q14: Broker */}
          <div>
            <Label htmlFor="broker">What broker do you use?</Label>
            <input
              id="broker"
              type="text"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="e.g. Exness, IC Markets"
              className="tj-input w-full"
            />
          </div>

          {/* Q15: Platform */}
          <div>
            <Label htmlFor="platform">What platform?</Label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="tj-input w-full"
            >
              <option value="">Select platform…</option>
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Q16: How did you hear about us */}
          <div>
            <Label htmlFor="heardFrom">How did you hear about Trade·Jernal?</Label>
            <select
              id="heardFrom"
              value={heardFrom}
              onChange={(e) => setHeardFrom(e.target.value)}
              className="tj-input w-full"
            >
              <option value="">Select options…</option>
              {HEARD_FROM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {/* Submit, Error, Privacy */}
      <div className="space-y-4">
        {errorMsg && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Feedback"}
        </button>

        <p className="text-center text-[10px] text-[color:var(--text-muted)]">
          We won&apos;t share your info with anyone. Email is only used to follow up if your feedback raised something worth discussing.
        </p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers components
// ---------------------------------------------------------------------------

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-semibold text-[color:var(--text-primary)]"
    >
      {children}
    </label>
  );
}

function Req() {
  return (
    <span className="ml-0.5 text-red-500" title="Required">
      *
    </span>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 mt-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition"
            style={{
              backgroundColor: active ? "rgba(59, 130, 246, 0.05)" : "transparent",
              borderColor: active ? "var(--accent-blue)" : "var(--border-panel)",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <span
              className="flex h-4.5 w-4.5 items-center justify-center rounded border transition"
              style={{
                borderColor: active ? "var(--accent-blue)" : "var(--text-muted)",
                backgroundColor: active ? "var(--accent-blue)" : "transparent",
              }}
            >
              {active && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span>{opt.label}</span>
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
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 mt-2">
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition"
            style={{
              backgroundColor: active ? "rgba(59, 130, 246, 0.05)" : "transparent",
              borderColor: active ? "var(--accent-blue)" : "var(--border-panel)",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className="flex h-4.5 w-4.5 items-center justify-center rounded-full border transition"
              style={{
                borderColor: active ? "var(--accent-blue)" : "var(--text-muted)",
              }}
            >
              {active && <span className="h-2 w-2 rounded-full bg-blue-500" />}
            </span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
