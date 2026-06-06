-- migrations/015_add_timezone_to_profiles.sql
-- Adds timezone column to profiles table

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
