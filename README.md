# trade-full-1

> **A modern trading journal + manual backtester for forex and crypto traders.**

[![Live demo](https://img.shields.io/badge/live-trade--full--1.vercel.app-blue?style=flat-square)](https://trade-full-1.vercel.app)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-orange.svg?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

A multi-tenant SaaS combining automated trade logging, performance analytics, an AI-powered insights engine, and a manual bar-by-bar strategy backtester. Built for retail forex and crypto traders, with first-class MT5 integration.

🔗 **Live**: https://trade-full-1.vercel.app

---

## Features

### Journal
- Multi-account support with strict tenant data isolation (PostgreSQL RLS)
- Manual trade entry with mindset tagging, custom tags, notes
- **CSV import** with multi-broker auto-detection (papaparse-based parser handles 15+ field synonyms)
- **Live MT5 sync** via a custom Expert Advisor — one-click EA download per account, no MetaApi.cloud subscription needed
- Real-time open positions display with unrealized P&L (polled every 8s)

### Analytics
- 6 KPI cards (Net P&L, Win Rate, Profit Factor, Best/Worst streak, etc.)
- Equity curve with drawdown overlay
- 7-dimension breakdowns: asset class, symbol, weekday, hour, mindset, tag, direction
- Monthly P&L calendar heatmap with click-to-day detail
- Date range filter (Today / 7d / 30d / 90d / YTD / custom)

### Intelligence
- **AI Insights** via Google Gemini 2.5 Flash — generates focus areas, blindspots, and observations from your last 30 trades (30min cooldown per account)
- **Position sizing calculator** with 17 pre-loaded instruments (forex majors + JPY pairs, metals, crypto, indices) plus custom contract value override
- N-part risk strategy management

### Backtester
- Crypto via Binance API (free, no key required)
- Forex / metals via TwelveData (free tier, API key required)
- Manual bar-by-bar replay with play / pause / step / speed controls
- Trade simulation: open positions at current bar, auto-close on SL/TP touch detection
- Session state persists across page refreshes
- Chart markers for entries and exits

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS |
| UI | Custom design system · Lucide icons · Recharts (dashboard) · Lightweight Charts (backtester) |
| Backend | Next.js API routes |
| Database | PostgreSQL via Supabase with Row-Level Security |
| Auth | Supabase Auth with `@supabase/ssr` cookies |
| AI | Google Gemini 2.5 Flash |
| Email | Resend (SMTP) |
| MT5 Integration | MQL5 Expert Advisor with per-account bearer tokens |
| Deployment | Vercel |

---

## Quick start (local development)

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- *(Optional)* Gemini API key — get one free at [Google AI Studio](https://aistudio.google.com)
- *(Optional)* TwelveData API key — get one free at [twelvedata.com](https://twelvedata.com/account/api-keys)

### Setup

```bash
# 1. Clone
git clone https://github.com/YOUR-USERNAME/trade-full-1.git
cd trade-full-1

# 2. Install
npm install --legacy-peer-deps

# 3. Configure
cp .env.local.example .env.local
# Edit .env.local — fill in your Supabase URL + anon key + service role key
```

### Run database migrations

In your Supabase project → SQL Editor, run each file in `migrations/` in order:

```
001_foundation.sql        — accounts table + RLS
002_profiles.sql          — user profiles + trigger
003_journal.sql           — trades, transactions, positions, settings
004_insights.sql          — AI insights cache
005_backtest.sql          — backtest sessions
006_account_polish.sql    — account archival
007_backtest_positions.sql — open positions in backtest sessions
```

### Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploying your own instance

1. Push your fork to GitHub
2. Import into Vercel
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only)*
   - `GEMINI_API_KEY` *(optional)*
   - `TWELVEDATA_API_KEY` *(optional)*
4. Deploy

The first deploy gives you a `*.vercel.app` URL. Add a custom domain later in Vercel project settings.

---

## Project structure

```
trade-full-1/
├── app/
│   ├── page.tsx, login/, signup/         Public routes
│   ├── dashboard/                         Authenticated routes
│   │   ├── page.tsx                       Account list
│   │   └── accounts/[id]/
│   │       ├── page.tsx                   Main dashboard (tabs)
│   │       ├── backtest/                  Backtester
│   │       └── settings/                  Per-account settings
│   └── api/
│       ├── ea/                            MT5 sync endpoints
│       ├── insights/                      Gemini-powered insights
│       ├── backtest/                      Backtest sessions + data
│       └── accounts/                      Account CRUD + token rotation
├── components/
│   ├── auth/                              Login, signup, password strength
│   ├── dashboard/                         Account nav, header, date filter
│   ├── account/                           Tab content + settings UI
│   ├── analytics/                         Reusable bar chart
│   ├── backtest/                          Backtester components
│   ├── overview/                          KPIs, equity curve, open positions
│   ├── trades/                            Add/edit trade, CSV import
│   └── insights/                          AI insights panel
├── lib/
│   ├── supabase/                          Client + server + middleware
│   ├── stats.ts                           KPI math
│   ├── analytics.ts                       Trade aggregation by dimension
│   ├── calculator.ts                      Position sizing math
│   ├── csv-parser.ts                      Multi-broker CSV detection
│   ├── gemini.ts                          AI insights generation
│   ├── data-sources.ts                    Binance + TwelveData fetchers
│   ├── backtest-trade.ts                  P&L + SL/TP hit detection
│   ├── backtest-instruments.ts            Symbol catalog
│   └── ea-template.ts                     MQL5 Expert Advisor source
└── migrations/                            SQL migrations (001-007)
```

---

## Architecture highlights

### Multi-tenant data isolation

Every table has a `user_id` column with Row-Level Security policies. The Supabase anon client passes the authenticated user's JWT on every request, which RLS uses to scope queries to that user's rows. The service role client (used only for trusted server-side ops like MT5 webhooks) bypasses RLS.

### MT5 Expert Advisor

Each trading account gets a unique `ea_token` (64-char hex). Users download a customized `.mq5` file from the Account tab with the token embedded at download time. The EA pushes closed trades and live position snapshots to `/api/ea/sync/trades` and `/api/ea/sync/positions`, authenticated via `Authorization: Bearer <ea_token>`. Tokens can be rotated from the Settings page.

### Backtester

Historical OHLC data is fetched from Binance for crypto pairs and TwelveData for forex and metals. The chart uses [TradingView's Lightweight Charts](https://www.tradingview.com/lightweight-charts/) library. Bar-by-bar reveal mode prevents future leak. Open positions persist as JSONB on the session row; closed trades land in the main `trades` table flagged `is_backtest=true` and are excluded from live analytics by default.

---

## Roadmap

- [x] **M1** — Auth + multi-tenant foundation
- [x] **M2.1** — Journal foundation (trades, KPIs, equity curve)
- [x] **M2.2** — Analytics + Calendar
- [x] **M2.3** — Position calculator + date filter + AI insights
- [x] **M3.1** — CSV import (multi-broker)
- [x] **M3.2** — MT5 EA + live sync
- [x] **M4.1** — Backtester foundation
- [x] **M4.2** — Playback engine + Settings page
- [x] **M4.3** — Trade simulation
- [ ] **M4.4** — Backtest analytics integration
- [ ] **M4.5** — Migration to TradingView Advanced Charts (pending approval)
- [ ] **M5** — Backtester polish (slippage, R-multiple, export)
- [ ] **M6** — Custom domain, billing, landing page polish

---

## Contributing

I appreciate help — but I'm the sole maintainer and own all IP in this project. By opening a pull request, you agree that:

1. Your contribution is licensed under **AGPL-3.0** along with the rest of the codebase
2. You assign all copyright in your contribution to the maintainer
3. You confirm you have the right to make this assignment

### How to contribute

1. **Open an issue first** to discuss your proposed change before writing code
2. Fork the repo and create a feature branch (`feat/your-change` or `fix/your-bug`)
3. Open a pull request with a clear description and screenshots if it changes UI
4. Wait for review

I reserve the right to reject any PR that doesn't fit the product vision. This isn't to be difficult — it's to keep the product coherent.

### What I'm looking for

- Bug fixes — always welcome
- Documentation improvements
- New broker CSV parsers (especially African brokers)
- Translations to local languages (Twi, Ewe, Hausa, etc.)
- Performance optimizations
- Accessibility improvements

### What I'm NOT looking for

- New top-level features without prior discussion in an issue
- Stylistic refactors that don't add user value
- AI-generated boilerplate PRs

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE) for the full text.

**Plain English summary:**

- ✅ You can read, learn from, and modify the code
- ✅ You can self-host it for personal use
- ✅ You can self-host it commercially — BUT you must publish your modified source code under AGPL too
- ❌ You cannot use this code in a closed-source commercial product without explicit permission

For commercial licensing without AGPL obligations (private fork, white-label, embedded use), contact the author.

---

## Author

**Ishmael Harry-Deckor** — Petroleum Engineering student at [KNUST](https://www.knust.edu.gh) (Kwame Nkrumah University of Science and Technology), Kumasi, Ghana. 

Building tools for retail traders in West Africa.

- Live: https://trade-full-1.vercel.app
- Email: *ishmaelharrydeckor@gmail.com*
- LinkedIn: *www.linkedin.com/in/ishmaelharrydeckor*


---

## Acknowledgments

- Inspired by [TradeZella](https://www.tradezella.com)
- Chart library: [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) by TradingView
- AI insights powered by [Google Gemini](https://ai.google.dev/)
- Data sources: [Binance](https://binance.com), [TwelveData](https://twelvedata.com)
- Email delivery: [Resend](https://resend.com)
- Database + auth: [Supabase](https://supabase.com)
- Hosting: [Vercel](https://vercel.com)

---

⭐ **Find this useful?** Give the repo a star and follow for updates. Feedback and bug reports welcome via Issues.
