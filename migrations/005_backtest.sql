-- 005_backtest.sql
-- Backtest sessions: each is a saved replay over a historical window. Trades
-- generated during a session land in the existing `trades` table with
-- is_backtest=true and backtest_session_id = this row's id.

CREATE TABLE IF NOT EXISTS public.backtest_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  symbol            TEXT NOT NULL,
  asset_class       TEXT NOT NULL,
  timeframe         TEXT NOT NULL,
  range_start       TIMESTAMPTZ NOT NULL,
  range_end         TIMESTAMPTZ NOT NULL,
  current_bar_time  TIMESTAMPTZ,
  starting_balance  NUMERIC(18,2) NOT NULL DEFAULT 10000,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','archived')),
  data_source       TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS backtest_sessions_account_idx
  ON public.backtest_sessions (account_id, created_at DESC);

ALTER TABLE public.backtest_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own backtests"    ON public.backtest_sessions;
DROP POLICY IF EXISTS "Users insert own backtests"  ON public.backtest_sessions;
DROP POLICY IF EXISTS "Users update own backtests"  ON public.backtest_sessions;
DROP POLICY IF EXISTS "Users delete own backtests"  ON public.backtest_sessions;

CREATE POLICY "Users view own backtests" ON public.backtest_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own backtests" ON public.backtest_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own backtests" ON public.backtest_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own backtests" ON public.backtest_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
