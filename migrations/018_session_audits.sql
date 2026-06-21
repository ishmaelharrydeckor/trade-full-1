-- migrations/018_session_audits.sql
-- Creates the session_audits table to track process compliance, execution score, and daily emotions.

CREATE TABLE IF NOT EXISTS public.session_audits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  audit_date            DATE NOT NULL,
  emotional_states      TEXT[] NOT NULL DEFAULT '{}',
  followed_plan         BOOLEAN NOT NULL,
  respected_risk        BOOLEAN NOT NULL,
  avoided_revenge       BOOLEAN NOT NULL,
  avoided_emotional     BOOLEAN NOT NULL,
  waited_setup          BOOLEAN NOT NULL,
  respected_sl          BOOLEAN NOT NULL,
  execution_score       INTEGER NOT NULL, -- 0 to 100
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, audit_date)
);

CREATE INDEX IF NOT EXISTS idx_session_audits_account_date ON public.session_audits(account_id, audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_audits_user ON public.session_audits(user_id);

ALTER TABLE public.session_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own audits" ON public.session_audits;
DROP POLICY IF EXISTS "Users insert own audits" ON public.session_audits;
DROP POLICY IF EXISTS "Users update own audits" ON public.session_audits;
DROP POLICY IF EXISTS "Users delete own audits" ON public.session_audits;
DROP POLICY IF EXISTS "Service role all audits" ON public.session_audits;

CREATE POLICY "Users select own audits" ON public.session_audits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own audits" ON public.session_audits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own audits" ON public.session_audits FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own audits" ON public.session_audits FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role all audits" ON public.session_audits FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
