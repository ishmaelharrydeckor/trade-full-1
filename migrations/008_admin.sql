-- 008_admin.sql
-- Adds an admin flag to profiles. Used by the in-app admin pages to gate
-- access to user/tester management views.
--
-- After running this migration, run the following to make YOURSELF the
-- first admin (replace the email with your actual one):
--
--   UPDATE public.profiles
--   SET is_admin = TRUE
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS profiles_admin_idx
  ON public.profiles (is_admin) WHERE is_admin = TRUE;
