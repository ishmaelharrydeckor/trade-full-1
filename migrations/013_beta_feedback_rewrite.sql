-- migrations/013_beta_feedback_rewrite.sql
-- Recreate the beta feedback table with the optimized 10-question layout

DROP TABLE IF EXISTS public.beta_feedback CASCADE;

create table public.beta_feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  
  -- Block 1: identifier
  email text not null,
  whatsapp text,
  
  -- Block 2: experience
  logged_trades text not null,                    -- enum: yes_several, yes_few, stuck, browsed
  previous_tracking text not null,                -- enum: excel, notebook, nothing, another_app, other
  previous_tracking_other text,                   -- conditional on previous_tracking
  features_used text[] not null,                  -- array of feature keys
  what_frustrated text,
  what_was_missing text,
  
  -- Block 3: signal
  sean_ellis_score text not null,                 -- enum: very, somewhat, not, not_using
  would_recommend text not null,                  -- enum: yes, maybe, no, later
  anything_else text,
  
  -- Block 4: optional
  full_name text,
  trading_experience text,
  what_they_trade text[],
  broker text,
  platform text,
  heard_from text,
  
  -- Metadata
  user_agent text,
  ip_country text
);

-- Index for admin queries
create index idx_beta_feedback_created_at on public.beta_feedback (created_at desc);
create index idx_beta_feedback_email on public.beta_feedback (email);

-- RLS: only the service role can read this table
alter table public.beta_feedback enable row level security;

create policy "Service role can do everything"
on public.beta_feedback for all
to service_role
using (true)
with check (true);

-- Public can INSERT only (for the feedback form)
create policy "Anyone can submit feedback"
on public.beta_feedback for insert
to anon, authenticated
with check (true);
