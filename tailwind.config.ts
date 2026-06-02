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
        sans: ['"Inter"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', "monospace"],
      },
      colors: {
        bg: {
          app: "var(--bg-app)",
          panel: "var(--bg-panel)",
          subtle: "var(--bg-subtle)",
          hover: "var(--bg-hover)",
        },
        border: {
          panel: "var(--border-panel)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          blue: "var(--accent-blue)",
          indigo: "var(--accent-indigo)",
          profit: "var(--accent-profit)",
          loss: "var(--accent-loss)",
          equity: "var(--accent-equity)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
