-- migrations/016_add_tags_to_journal_entries.sql
-- Adds tags column to journal_entries table

ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
