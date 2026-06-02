-- Migration 010: Progress Tracker / Discipline Heatmap + Dashboard layout

-- Daily habits (user-defined checklists)
CREATE TABLE IF NOT EXISTS public.daily_habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT DEFAULT 'trading',
  is_automated  BOOLEAN DEFAULT FALSE,
  auto_rule     JSONB,
  sort_order    INTEGER DEFAULT 0,
  archived      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_habits_account ON public.daily_habits(account_id);

ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own habits" ON public.daily_habits;
CREATE POLICY "Users select own habits" ON public.daily_habits FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own habits" ON public.daily_habits;
CREATE POLICY "Users insert own habits" ON public.daily_habits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own habits" ON public.daily_habits;
CREATE POLICY "Users update own habits" ON public.daily_habits FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own habits" ON public.daily_habits;
CREATE POLICY "Users delete own habits" ON public.daily_habits FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all habits" ON public.daily_habits;
CREATE POLICY "Service role all habits" ON public.daily_habits FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Daily logs (completion tracking)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  log_date          DATE NOT NULL,
  habits_completed  UUID[] DEFAULT '{}',
  habits_violated   UUID[] DEFAULT '{}',
  notes             TEXT,
  score             INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_account_date ON public.daily_logs(account_id, log_date DESC);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own logs" ON public.daily_logs;
CREATE POLICY "Users select own logs" ON public.daily_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own logs" ON public.daily_logs;
CREATE POLICY "Users insert own logs" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own logs" ON public.daily_logs;
CREATE POLICY "Users update own logs" ON public.daily_logs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own logs" ON public.daily_logs;
CREATE POLICY "Users delete own logs" ON public.daily_logs FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all logs" ON public.daily_logs;
CREATE POLICY "Service role all logs" ON public.daily_logs FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE TRIGGER set_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Dashboard layout preferences
ALTER TABLE public.account_settings ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;
