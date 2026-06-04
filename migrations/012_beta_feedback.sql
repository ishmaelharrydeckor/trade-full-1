-- migrations/012_beta_feedback.sql
-- Table to store user feedback from the public beta tester form.

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  whatsapp            TEXT,
  trading_duration    TEXT NOT NULL,
  what_you_trade      TEXT[] NOT NULL DEFAULT '{}',
  broker              TEXT,
  platforms           TEXT[] NOT NULL DEFAULT '{}',
  hear_about          TEXT NOT NULL,
  has_account         TEXT NOT NULL,
  features_used       TEXT[] NOT NULL DEFAULT '{}',
  rating              INTEGER NOT NULL,
  impressed_feature   TEXT NOT NULL,
  frustrated_feature  TEXT NOT NULL,
  would_pay           TEXT NOT NULL,
  max_price           TEXT NOT NULL,
  wished_feature      TEXT NOT NULL,
  would_recommend     TEXT NOT NULL,
  other_feedback      TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Allow service role access (which is bypassed by default but clean practice)
CREATE POLICY "Service role all beta feedback" ON public.beta_feedback
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
