// components/auth/PasswordStrength.tsx
// Live password strength meter — 0 to 5 score with 5 visual segments.
// Score criteria:
//   1. At least 8 characters
//   2. At least 12 characters
//   3. Has both upper & lower case
//   4. Has a number
//   5. Has a special character

"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Criterion {
  label: string;
  test: (s: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "8+ characters", test: (s) => s.length >= 8 },
  { label: "12+ characters", test: (s) => s.length >= 12 },
  { label: "Upper & lowercase", test: (s) => /[a-z]/.test(s) && /[A-Z]/.test(s) },
  { label: "Number", test: (s) => /\d/.test(s) },
  { label: "Special character", test: (s) => /[^a-zA-Z0-9]/.test(s) },
];

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const met = CRITERIA.map((c) => c.test(password));
  const score = met.filter(Boolean).length;

  const label =
    score === 0
      ? "Too short"
      : score <= 2
        ? "Weak"
        : score === 3
          ? "Fair"
          : score === 4
            ? "Good"
            : "Strong";

  const tone =
    score <= 2 ? "loss" : score === 3 ? "warm" : "profit";

  return (
    <div className="mt-2 space-y-2">
      {/* Segment bar */}
      <div className="flex gap-1">
        {CRITERIA.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              i < score
                ? tone === "profit"
                  ? "bg-emerald-500"
                  : tone === "warm"
                    ? "bg-amber-400"
                    : "bg-red-400"
                : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Label */}
      <div
        className={cn(
          "text-[11px]",
          tone === "profit"
            ? "text-emerald-300"
            : tone === "warm"
              ? "text-amber-300"
              : "text-red-300"
        )}
      >
        Strength: <span className="font-semibold">{label}</span>
      </div>

      {/* Criteria checklist */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        {CRITERIA.map((c, i) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-1",
              met[i] ? "text-emerald-300" : "text-slate-500"
            )}
          >
            {met[i] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
