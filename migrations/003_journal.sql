-- migrations/003_journal.sql
-- M2.1 schema: the heart of the journal.
-- Adds: trades, account_transactions, account_settings, open_positions
-- All scoped per-(user, account) with RLS that filters by auth.uid().

-- ============================================================
-- TRADES — every closed trade lives here.
-- The same table holds live trades, manually-entered trades, and
-- backtest trades (distinguished by is_backtest + backtest_session_id).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trades (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  external_trade_id     TEXT,                      -- MT5 ticket # or CSV row id for dedup
  symbol                TEXT NOT NULL,             -- e.g. XAUUSD, BTCUSDT
  direction             TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  volume                NUMERIC NOT NULL,          -- lots
  entry_price           NUMERIC NOT NULL,
  exit_price            NUMERIC,                   -- null = still open (rare for this table)
  open_time             TIMESTAMPTZ NOT NULL,
  close_time            TIMESTAMPTZ,
  pnl                   NUMERIC,                   -- net P&L after spread/commission as reported
  commission            NUMERIC NOT NULL DEFAULT 0,
  swap                  NUMERIC NOT NULL DEFAULT 0,
  stop_loss             NUMERIC,
  take_profit           NUMERIC,
  risk_amount           NUMERIC,                   -- $ at risk at entry (computed from SL distance)
  asset_class           TEXT,                      -- 'forex' / 'crypto' / 'indices' / 'commodities' / 'stocks' / 'synthetics'
  tags                  TEXT[],                    -- free-form trader tags
  mindset               TEXT,                      -- 'focused', 'rushed', 'revenge', 'fomo', 'disciplined', 'anxious'
  notes                 TEXT,
  screenshot_url        TEXT,
  is_backtest           BOOLEAN NOT NULL DEFAULT FALSE,
  backtest_session_id   UUID,                      -- FK added in M4 when backtest_sessions exists
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, external_trade_id)
);

CREATE INDEX IF NOT EXISTS trades_account_close_time_idx
  ON public.trades (account_id, close_time DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS trades_user_idx ON public.trades (user_id);
CREATE INDEX IF NOT EXISTS trades_backtest_idx
  ON public.trades (account_id, is_backtest);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own trades"   ON public.trades;
DROP POLICY IF EXISTS "Users insert own trades"   ON public.trades;
DROP POLICY IF EXISTS "Users update own trades"   ON public.trades;
DROP POLICY IF EXISTS "Users delete own trades"   ON public.trades;
DROP POLICY IF EXISTS "Service role all trades"   ON public.trades;

CREATE POLICY "Users select own trades" ON public.trades
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own trades" ON public.trades
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own trades" ON public.trades
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own trades" ON public.trades
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role all trades" ON public.trades
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP TRIGGER IF EXISTS set_updated_at_trades ON public.trades;
CREATE TRIGGER set_updated_at_trades
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ACCOUNT_TRANSACTIONS — deposits and withdrawals.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount        NUMERIC NOT NULL CHECK (amount >= 0),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tx_account_occurred_idx
  ON public.account_transactions (account_id, occurred_at DESC);

ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own tx" ON public.account_transactions;
DROP POLICY IF EXISTS "Users insert own tx" ON public.account_transactions;
DROP POLICY IF EXISTS "Users update own tx" ON public.account_transactions;
DROP POLICY IF EXISTS "Users delete own tx" ON public.account_transactions;
DROP POLICY IF EXISTS "Service role all tx" ON public.account_transactions;

CREATE POLICY "Users select own tx" ON public.account_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own tx" ON public.account_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own tx" ON public.account_transactions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own tx" ON public.account_transactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role all tx" ON public.account_transactions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- ACCOUNT_SETTINGS — one row per account, holds the risk strategy.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
  risk_parts    INTEGER NOT NULL DEFAULT 10
                  CHECK (risk_parts BETWEEN 1 AND 100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own settings" ON public.account_settings;
DROP POLICY IF EXISTS "Users insert own settings" ON public.account_settings;
DROP POLICY IF EXISTS "Users update own settings" ON public.account_settings;
DROP POLICY IF EXISTS "Service role all settings" ON public.account_settings;

CREATE POLICY "Users select own settings" ON public.account_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own settings" ON public.account_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own settings" ON public.account_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role all settings" ON public.account_settings
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP TRIGGER IF EXISTS set_updated_at_settings ON public.account_settings;
CREATE TRIGGER set_updated_at_settings
  BEFORE UPDATE ON public.account_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- OPEN_POSITIONS — live snapshot pushed by the MT5 EA every ~10s.
-- Empty for accounts with no EA running. Coming online in M3.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.open_positions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  external_position_id  TEXT NOT NULL,
  symbol                TEXT NOT NULL,
  direction             TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  volume                NUMERIC NOT NULL,
  entry_price           NUMERIC NOT NULL,
  open_time             TIMESTAMPTZ NOT NULL,
  stop_loss             NUMERIC,
  take_profit           NUMERIC,
  current_price         NUMERIC,
  unrealized_pnl        NUMERIC,
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, external_position_id)
);

CREATE INDEX IF NOT EXISTS open_positions_account_idx
  ON public.open_positions (account_id, synced_at DESC);

ALTER TABLE public.open_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own positions" ON public.open_positions;
DROP POLICY IF EXISTS "Service role all positions" ON public.open_positions;

CREATE POLICY "Users select own positions" ON public.open_positions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Only the service-role EA endpoint writes/clears open positions.
CREATE POLICY "Service role all positions" ON public.open_positions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
