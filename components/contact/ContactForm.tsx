// components/contact/ContactForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ContactForm() {
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Client-side validations
    if (!name.trim()) {
      setErrorMessage("Name is required.");
      setIsLoading(false);
      return;
    }
    if (name.length > 100) {
      setErrorMessage("Name must be 100 characters or less.");
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (email.length > 254) {
      setErrorMessage("Email must be 254 characters or less.");
      setIsLoading(false);
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("Subject is required.");
      setIsLoading(false);
      return;
    }
    if (subject.length > 200) {
      setErrorMessage("Subject must be 200 characters or less.");
      setIsLoading(false);
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Message is required.");
      setIsLoading(false);
      return;
    }
    if (message.length > 5000) {
      setErrorMessage("Message must be 5000 characters or less.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          website: website.trim(), // Send honeypot field
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong sending your message. Please try again, or email us directly at hello@tradejernal.com.");
      }

      // Success
      setIsSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setWebsite("");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error 
          ? err.message 
          : "Something went wrong sending your message. Please try again, or email us directly at hello@tradejernal.com."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        className="rounded-2xl p-8 text-center transition-all duration-300"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-semibold mb-4 text-[color:var(--text-primary)]">
          Thanks for reaching out.
        </h2>
        <p className="text-sm leading-relaxed text-[color:var(--text-secondary)] mb-6 max-w-md mx-auto">
          We've received your message and will get back to you within 24-48 hours. In the meantime, feel free to keep exploring Trade·Journal.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 hover:scale-[1.02]"
          style={{ minHeight: "48px" }}
        >
          Back to home &rarr;
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div 
          className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs md:text-sm leading-relaxed"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Honeypot field (hidden for spam prevention) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold text-[color:var(--text-secondary)] mb-2 uppercase tracking-wide">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kwame Mensah"
          className="tj-input w-full"
          style={{ minHeight: "44px" }}
          disabled={isLoading}
        />
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-[color:var(--text-secondary)] mb-2 uppercase tracking-wide">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kwame@example.com"
          className="tj-input w-full"
          style={{ minHeight: "44px" }}
          disabled={isLoading}
        />
      </div>

      {/* Subject Input */}
      <div>
        <label htmlFor="subject" className="block text-xs font-bold text-[color:var(--text-secondary)] mb-2 uppercase tracking-wide">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          required
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Workflow review question"
          className="tj-input w-full"
          style={{ minHeight: "44px" }}
          disabled={isLoading}
        />
      </div>

      {/* Message Input */}
      <div>
        <label htmlFor="message" className="block text-xs font-bold text-[color:var(--text-secondary)] mb-2 uppercase tracking-wide">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          className="tj-input w-full resize-none p-3"
          style={{ minHeight: "120px" }}
          disabled={isLoading}
        />
        <div className="text-right text-[10px] text-[color:var(--text-muted)] mt-1">
          {message.length}/5000
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
        style={{ minHeight: "48px" }}
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send message →"}
      </button>
    </form>
  );
}
