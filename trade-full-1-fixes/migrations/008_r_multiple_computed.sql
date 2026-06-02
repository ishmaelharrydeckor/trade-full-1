-- migrations/008_r_multiple_computed.sql
--
-- Adds r_multiple as a GENERATED ALWAYS (stored) computed column so it is
-- never recalculated client-side and never has floating-point drift.
--
-- Adjust column names below if your schema uses different names.
-- Run in: Supabase Dashboard → SQL Editor
--
-- Prerequisites: trades table must have columns:
--   entry_price  NUMERIC
--   stop_loss    NUMERIC
--   take_profit  NUMERIC
--   direction    TEXT  ('buy' | 'sell')

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS r_multiple NUMERIC GENERATED ALWAYS AS (
    CASE
      -- Both SL and TP must be set, and SL must differ from entry
      WHEN stop_loss IS NOT NULL
        AND take_profit IS NOT NULL
        AND entry_price IS NOT NULL
        AND stop_loss <> entry_price
      THEN ROUND(
        CASE
          WHEN direction = 'buy'  THEN (take_profit  - entry_price) / (entry_price - stop_loss)
          WHEN direction = 'sell' THEN (entry_price  - take_profit) / (stop_loss   - entry_price)
          ELSE                         (take_profit  - entry_price) / ABS(entry_price - stop_loss)
        END,
        2
      )
      ELSE NULL
    END
  ) STORED;

-- Index so you can cheaply filter / order by R-multiple
CREATE INDEX IF NOT EXISTS idx_trades_r_multiple
  ON trades (r_multiple)
  WHERE r_multiple IS NOT NULL;

COMMENT ON COLUMN trades.r_multiple IS
  'Risk-reward ratio stored as a generated column. Positive = reward exceeds risk. NULL when SL or TP is missing.';
