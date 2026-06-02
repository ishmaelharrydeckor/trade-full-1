-- 007_backtest_positions.sql
-- Stores currently open positions inside a backtest session as JSONB on the
-- session row. Persists across page refreshes; cleared when positions close.

ALTER TABLE public.backtest_sessions
  ADD COLUMN IF NOT EXISTS open_positions JSONB NOT NULL DEFAULT '[]'::jsonb;
