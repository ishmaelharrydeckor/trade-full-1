"use client";

// components/ui/FeatureAnimation.tsx
// Client-side wrapper that renders the correct animated SVG icon.

import { SyncAnimation, AiAnimation, CalculatorAnimation } from "./AnimatedFeatureIcons";

export default function FeatureAnimation({ type }: { type: "sync" | "ai" | "calc" }) {
  switch (type) {
    case "sync":
      return <SyncAnimation />;
    case "ai":
      return <AiAnimation />;
    case "calc":
      return <CalculatorAnimation />;
  }
}
