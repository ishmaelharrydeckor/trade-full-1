-- Migration 009: Notebook / Session Planner

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  entry_date          DATE NOT NULL,
  pre_session_plan    TEXT,
  post_session_review TEXT,
  market_conditions   TEXT,
  mental_state        TEXT,
  lessons_learned     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_journal_account_date ON public.journal_entries(account_id, entry_date DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own journal" ON public.journal_entries;
CREATE POLICY "Users select own journal" ON public.journal_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own journal" ON public.journal_entries;
CREATE POLICY "Users insert own journal" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own journal" ON public.journal_entries;
CREATE POLICY "Users update own journal" ON public.journal_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own journal" ON public.journal_entries;
CREATE POLICY "Users delete own journal" ON public.journal_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all journal" ON public.journal_entries;
CREATE POLICY "Service role all journal" ON public.journal_entries FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE TRIGGER set_journal_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
