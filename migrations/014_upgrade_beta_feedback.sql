-- migrations/014_upgrade_beta_feedback.sql
-- Add new positioning, PMF, and user research fields to the beta_feedback table

ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS why_try_tj TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS biggest_challenge TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS pre_belief TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS belief_changed TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS most_valuable TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS did_surprise TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS why_sean_ellis TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS willing_recommend TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS testimonial_helps TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS explain_to_trader TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS open_interview TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS contact_details TEXT;
