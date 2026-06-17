-- migrations/017_behavioral_flags.sql
-- Creates the behavioral_flags table to track and persist psychological/behavioral errors over time.

CREATE TABLE IF NOT EXISTS public.behavioral_flags (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  flag_type             TEXT NOT NULL CHECK (flag_type IN ('revenge_trading', 'overconfidence_overtrading', 'strategy_switching')),
  trigger_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  trigger_trade_ids     UUID[] NOT NULL,
  details               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS behavioral_flags_account_date_idx
  ON public.behavioral_flags (account_id, trigger_date DESC);
CREATE INDEX IF NOT EXISTS behavioral_flags_user_idx
  ON public.behavioral_flags (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.behavioral_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users select own behavioral flags" ON public.behavioral_flags;
DROP POLICY IF EXISTS "Users insert own behavioral flags" ON public.behavioral_flags;
DROP POLICY IF EXISTS "Users update own behavioral flags" ON public.behavioral_flags;
DROP POLICY IF EXISTS "Users delete own behavioral flags" ON public.behavioral_flags;
DROP POLICY IF EXISTS "Service role all behavioral flags" ON public.behavioral_flags;

-- Policies matching accounts/trades
CREATE POLICY "Users select own behavioral flags" ON public.behavioral_flags
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own behavioral flags" ON public.behavioral_flags
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own behavioral flags" ON public.behavioral_flags
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own behavioral flags" ON public.behavioral_flags
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role all behavioral flags" ON public.behavioral_flags
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
