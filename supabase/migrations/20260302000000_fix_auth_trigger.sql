-- ============================================================================
-- Fix: handle_new_user trigger on auth.users
-- ============================================================================
-- The original trigger inserted into a non-existent `profiles` table.
-- This fixes it to insert into the actual `users` table with correct
-- snake_case column names matching the LIVE database schema.
--
-- NOTE: The live DB uses snake_case columns (display_name, created_at, etc.)
-- even though the initial migration file used quoted camelCase.
--
-- ON CONFLICT (id) DO NOTHING prevents errors when client code also creates
-- the profile row.
--
-- EXCEPTION WHEN unique_violation handles the case where a legacy user row
-- already exists with the same email but a different id. In that case we
-- update the existing row's id to match the new auth.users id so the
-- foreign key references work correctly.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'participant',
    'approved',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Legacy user row exists with same email but different id — update the id
    UPDATE public.users
    SET id = NEW.id, updated_at = now()
    WHERE lower(email) = lower(NEW.email);
    RETURN NEW;
END;
$function$;
