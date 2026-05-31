-- migrations/001_foundation.sql
-- The foundation for trade-full-1: one accounts table.
-- Every future data table (trades, transactions, open positions, insights)
-- will reference accounts.id and inherit RLS through it.

-- ============================================================
-- accounts: one user can have many trading accounts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  broker            TEXT,
  account_number    TEXT,
  currency          TEXT NOT NULL DEFAULT 'USD',
  starting_balance  NUMERIC,
  ea_token          UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx
  ON public.accounts (user_id);
CREATE INDEX IF NOT EXISTS accounts_ea_token_idx
  ON public.accounts (ea_token);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies so re-running this is safe
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Service role has full access" ON public.accounts;

-- A user can only ever see / write rows where user_id matches their auth.uid()
CREATE POLICY "Users can view their own accounts"
  ON public.accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own accounts"
  ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own accounts"
  ON public.accounts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- The service role (used by trusted backend routes, e.g. the MT5 webhook)
-- can bypass RLS to attribute trades to the correct account by ea_token.
CREATE POLICY "Service role has full access"
  ON public.accounts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- updated_at trigger for accounts (reusable for future tables)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_accounts ON public.accounts;
CREATE TRIGGER set_updated_at_accounts
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
