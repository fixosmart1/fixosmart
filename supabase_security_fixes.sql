-- FixoSmart Supabase Security Fixes
-- Run this in: Supabase Dashboard → SQL Editor
-- This fixes all Security Advisor warnings

-- 1. Enable RLS on the profiles table (fixes the 1 remaining ERROR)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policy so auth users can only read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Fix handle_new_user function — set search_path (fixes the mutable search path WARNING)
--    Also add ON CONFLICT DO NOTHING to prevent auth failures from duplicate inserts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, language)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'customer',
    'en'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 4. For the "RLS Enabled No Policy" INFO suggestions on our app tables:
--    These tables are accessed only through the Vercel backend (postgres superuser bypasses RLS)
--    so they don't need policies. But to silence the INFO, add a service_role bypass policy.
DO $body$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['users','technicians','technician_verifications','services','products',
    'bookings','service_addons','reviews','iqama_trackers','subscriptions',
    'promo_codes','site_settings','session_store'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('
        CREATE POLICY IF NOT EXISTS "Backend service access"
        ON public.%I
        TO service_role
        USING (true)
        WITH CHECK (true)
      ', t);
    END IF;
  END LOOP;
END
$body$;

-- Verify: show tables with RLS status
SELECT relname, relrowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
AND relkind = 'r'
ORDER BY relname;
