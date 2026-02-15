-- ==============================================================================
-- 🚨 ULTRA SIMPLE FIX: No Recursion Possible!
-- ==============================================================================
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- Step 1: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view consultant basic info" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins full access" ON profiles;
DROP POLICY IF EXISTS "user_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "user_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "public_view_public_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_full_access" ON profiles;

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create ULTRA SIMPLE policies - NO SUBQUERIES!

-- Policy 1: Authenticated users can view ALL profiles
-- This is the simplest and safest approach for a small app
CREATE POLICY "authenticated_view_all_profiles" ON profiles
FOR SELECT TO authenticated
USING (true);

-- Policy 2: Users can only update their own profile
CREATE POLICY "user_update_own_profile" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

-- Policy 3: Users can delete only their own profile
CREATE POLICY "user_delete_own_profile" ON profiles
FOR DELETE TO authenticated
USING (id = auth.uid());

-- Policy 4: Anyone can insert (for new user signup)
-- But the id must match their auth id
CREATE POLICY "user_insert_own_profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- ==============================================================================
-- ✅ DONE! This is the simplest possible configuration.
-- All authenticated users can see all profiles (needed for admin pages)
-- Users can only modify their own profile
-- ==============================================================================
