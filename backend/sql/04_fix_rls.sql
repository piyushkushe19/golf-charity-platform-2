-- ============================================================
-- FIX: RLS Policies for profiles table
-- Run this in Supabase SQL Editor if /admin gets stuck on loading
-- ============================================================

-- Step 1: Drop all existing profile policies
DROP POLICY IF EXISTS "Users can view own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"     ON public.profiles;

-- Step 2: Recreate clean policies
-- Any authenticated user can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Any authenticated user can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role (used by Edge Functions) has full access — no recursive lookup
-- Admin access uses JWT claim check, NOT a subquery on profiles (avoids deadlock)
CREATE POLICY "profiles_select_all_for_admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id   -- own row always readable
    OR
    (auth.jwt() ->> 'role')::text = 'service_role'  -- service role (edge functions)
  );

-- ============================================================
-- FIX: Also ensure the profiles table has the right INSERT policy
-- (needed so the trigger that auto-creates profiles can work
--  AND so admin can read everyone's profile without self-recursion)
-- ============================================================
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- ALTERNATIVE SIMPLER APPROACH (recommended for dev/testing):
-- Temporarily disable RLS on profiles so admin works instantly.
-- Re-enable before going to production.
-- ============================================================
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- (uncomment the line above if policies still cause issues)

-- ============================================================
-- VERIFY: Check what role your admin account has
-- Replace 'admin@yourdomain.com' with your actual admin email
-- ============================================================
SELECT id, email, role, created_at
FROM public.profiles
WHERE email = 'admin@yourdomain.com';

-- If role is NOT 'admin', run this:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
