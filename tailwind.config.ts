import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', "monospace"],
      },
      colors: {
        // Semantic surface tokens
        "app-bg": "var(--app-bg)",
        "app-surface": "var(--app-surface)",
        "app-elevated": "var(--app-elevated)",
        "app-border": "var(--app-border)",
        "app-muted": "var(--app-muted)",

        // Text tokens
        "tx-primary": "var(--text-primary)",
        "tx-secondary": "var(--text-secondary)",
        "tx-muted": "var(--text-muted)",

        // Accent
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          glow: "var(--accent-glow)",
        },

        // Semantic
        positive: "var(--positive)",
        negative: "var(--negative)",
        warning: "var(--warning)",

        // Legacy aliases (keep existing components working)
        bg: {
          app: "var(--app-bg)",
          panel: "var(--app-surface)",
          subtle: "var(--app-elevated)",
          hover: "var(--app-elevated)",
        },
        border: {
          panel: "var(--app-border)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
      borderColor: {
        DEFAULT: "var(--app-border)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
