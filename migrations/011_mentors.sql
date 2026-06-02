-- Migration 011: Mentor Mode

CREATE TABLE IF NOT EXISTS public.mentor_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invite_code   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  permissions   TEXT[] DEFAULT '{view_dashboard, view_trades, view_analytics}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_id, mentee_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_links_mentor ON public.mentor_links(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_links_mentee ON public.mentor_links(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_links_invite ON public.mentor_links(invite_code);

ALTER TABLE public.mentor_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own mentor links" ON public.mentor_links;
CREATE POLICY "Users see own mentor links" ON public.mentor_links FOR SELECT TO authenticated USING (mentor_id = auth.uid() OR mentee_id = auth.uid());
DROP POLICY IF EXISTS "Mentees insert links" ON public.mentor_links;
CREATE POLICY "Mentees insert links" ON public.mentor_links FOR INSERT TO authenticated WITH CHECK (mentee_id = auth.uid());
DROP POLICY IF EXISTS "Users update own links" ON public.mentor_links;
CREATE POLICY "Users update own links" ON public.mentor_links FOR UPDATE TO authenticated USING (mentor_id = auth.uid() OR mentee_id = auth.uid()) WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own links" ON public.mentor_links;
CREATE POLICY "Users delete own links" ON public.mentor_links FOR DELETE TO authenticated USING (mentor_id = auth.uid() OR mentee_id = auth.uid());
DROP POLICY IF EXISTS "Service role all mentor links" ON public.mentor_links;
CREATE POLICY "Service role all mentor links" ON public.mentor_links FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE TRIGGER set_mentor_links_updated_at BEFORE UPDATE ON public.mentor_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trade comments (mentor feedback on trades)
CREATE TABLE IF NOT EXISTS public.trade_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id      UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_comments_trade ON public.trade_comments(trade_id);

ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see trade comments" ON public.trade_comments;
CREATE POLICY "Users see trade comments" ON public.trade_comments FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR trade_id IN (
    SELECT id FROM public.trades WHERE user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users insert comments" ON public.trade_comments;
CREATE POLICY "Users insert comments" ON public.trade_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own comments" ON public.trade_comments;
CREATE POLICY "Users delete own comments" ON public.trade_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Service role all comments" ON public.trade_comments;
CREATE POLICY "Service role all comments" ON public.trade_comments FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
