-- 006_account_polish.sql
-- Adds the `archived` flag to accounts so they can be hidden from the main
-- dashboard without losing their history.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS accounts_user_archived_idx
  ON public.accounts (user_id, archived);
