# trade-full-1

Multi-tenant trading journal. Foundation drop — **Milestone 1**: authentication + per-user data isolation.

## What this drop ships

- ✅ Next.js 14 + TypeScript + Tailwind, fresh project
- ✅ Supabase Auth (email/password) with proper SSR cookie handling
- ✅ Landing page, login, signup, sign out
- ✅ Route protection via Next.js middleware
- ✅ Multi-tenant `accounts` table with RLS enforced at the database
- ✅ Dashboard placeholder where users create their first trading account
- ✅ Per-account `ea_token` for future MT5 webhook attribution

**What's coming in Milestone 2** (next drop): porting the analytics, calendar, drawdown, calculator, AI insights, and the MT5 EA flow from the old single-tenant `trades` repo into this multi-tenant version.

---

## Setup

### 1. Run the database migration

In your Supabase project → SQL Editor → New query → paste the entire contents of `migrations/001_foundation.sql` → Run.

You should see "Success. No rows returned." This creates the `accounts` table with RLS policies that ensure users can only ever see their own rows.

### 2. Get your Supabase service role key

Supabase Dashboard → Project Settings → API → `service_role` secret. **Keep this private.** You'll need it for server-side actions later (webhooks, admin ops).

### 3. Install and run locally

```bash
npm install
cp .env.local.example .env.local
# Open .env.local — the public keys are already filled in.
# Add your SUPABASE_SERVICE_ROLE_KEY to the SUPABASE_SERVICE_ROLE_KEY line.
npm run dev
```

Open http://localhost:3000 — you should see the landing page. Click **Get started**, create an account, get redirected to the dashboard, and you can create your first trading account.

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel → connect the repo
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key — Vercel only, never commit)
4. Deploy

The first deploy gives you a `*.vercel.app` URL. You can add a custom domain later in Vercel project settings.

---

## Architecture notes

### Authentication

- Uses `@supabase/ssr` (the modern way for Next.js App Router)
- Three Supabase clients:
  - `lib/supabase/client.ts` — browser, for `"use client"` components
  - `lib/supabase/server.ts` — server components, route handlers, server actions
  - `lib/supabase/middleware.ts` — refreshes auth cookies on every request
- Middleware enforces route protection: `/dashboard/*` requires auth, `/login` and `/signup` redirect logged-in users back to dashboard

### Multi-tenant data isolation

- Every data table has a `user_id` column referencing `auth.users(id)`
- RLS policies on every table filter by `user_id = auth.uid()`
- The Supabase anon client (used in the browser and in server components) automatically passes the user's JWT, so RLS filters their queries
- The service role client bypasses RLS — only used in trusted server-side code (e.g. the MT5 webhook that doesn't have a user JWT)

### Why the `ea_token` per account

When the MT5 expert advisor sends a trade, it needs to attribute it to a specific account. The token is the link: the EA includes the token in the request headers, the backend looks up the account by token, attributes the trade to that account. This is how multi-account, multi-user MT5 sync works without sharing a global secret.

---

## File map

```
trade-full-1/
├── app/
│   ├── page.tsx                  Landing
│   ├── login/page.tsx            Sign in
│   ├── signup/page.tsx           Create account
│   ├── auth/callback/route.ts    Email confirmation handler
│   ├── auth/signout/route.ts     Sign out
│   └── dashboard/
│       ├── layout.tsx            Protected layout
│       ├── page.tsx              Welcome + account list
│       └── accounts/
│           ├── page.tsx          Account management
│           └── new/page.tsx      Create account form
├── components/
│   ├── auth/                     LoginForm, SignupForm, AuthShell
│   └── dashboard/                Nav, CreateAccountForm
├── lib/
│   ├── supabase/                 client.ts, server.ts, middleware.ts
│   └── utils.ts                  cn() helper
├── middleware.ts                 Auth gate
└── migrations/
    └── 001_foundation.sql        accounts table + RLS
```

---

## Next steps

When this is deployed and you can sign up + create an account, the next drop (Milestone 2) ports the dashboard features: trades table, equity curve, drawdown, position sizing calculator, AI insights, the MT5 EA flow.

Until then: try to break it. Sign up twice, confirm User A can't see User B's accounts, confirm signing out works, confirm the email confirmation flow if it's enabled in Supabase.
