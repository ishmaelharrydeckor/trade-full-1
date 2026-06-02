-- Migration 008: Playbooks, trade grading, missed trades
-- Run in Supabase SQL Editor

-- 1. Add new columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS is_missed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('A+', 'A', 'B', 'C', 'D', 'F'));

-- 2. Playbooks (strategy definitions)
CREATE TABLE IF NOT EXISTS public.playbooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  rules         JSONB NOT NULL DEFAULT '[]',
  tags          TEXT[] DEFAULT '{}',
  archived      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbooks_account ON public.playbooks(account_id);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own playbooks" ON public.playbooks;
CREATE POLICY "Users select own playbooks" ON public.playbooks FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own playbooks" ON public.playbooks;
CREATE POLICY "Users insert own playbooks" ON public.playbooks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own playbooks" ON public.playbooks;
CREATE POLICY "Users update own playbooks" ON public.playbooks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own playbooks" ON public.playbooks;
CREATE POLICY "Users delete own playbooks" ON public.playbooks FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all playbooks" ON public.playbooks;
CREATE POLICY "Service role all playbooks" ON public.playbooks FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE TRIGGER set_playbooks_updated_at BEFORE UPDATE ON public.playbooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Trade-Playbook linkage
CREATE TABLE IF NOT EXISTS public.trade_playbook_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id        UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  playbook_id     UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  rules_followed  UUID[] DEFAULT '{}',
  rules_broken    UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trade_id, playbook_id)
);

CREATE INDEX IF NOT EXISTS idx_tpe_trade ON public.trade_playbook_entries(trade_id);
CREATE INDEX IF NOT EXISTS idx_tpe_playbook ON public.trade_playbook_entries(playbook_id);

ALTER TABLE public.trade_playbook_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own tpe" ON public.trade_playbook_entries;
CREATE POLICY "Users select own tpe" ON public.trade_playbook_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own tpe" ON public.trade_playbook_entries;
CREATE POLICY "Users insert own tpe" ON public.trade_playbook_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own tpe" ON public.trade_playbook_entries;
CREATE POLICY "Users update own tpe" ON public.trade_playbook_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own tpe" ON public.trade_playbook_entries;
CREATE POLICY "Users delete own tpe" ON public.trade_playbook_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all tpe" ON public.trade_playbook_entries;
CREATE POLICY "Service role all tpe" ON public.trade_playbook_entries FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
