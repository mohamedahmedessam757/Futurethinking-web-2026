-- ==============================================================================
-- 🚨 CRITICAL FIX: Remove infinite recursion in profiles RLS
-- RUN THIS IMMEDIATELY IN SUPABASE SQL EDITOR
-- ==============================================================================

-- Step 1: Drop ALL existing policies on profiles to clear the recursion
DROP POLICY IF EXISTS "Public can view consultant basic info" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 2: Create SIMPLE non-recursive policies

-- Policy 1: Users can ALWAYS see their own profile (critical for login)
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- Policy 2: Public can view consultant and admin profiles (for listing)
CREATE POLICY "Public can view public profiles" ON profiles 
FOR SELECT 
USING (role IN ('consultant', 'admin'));

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Policy 4: Admin full access using JWT metadata (NO RECURSION!)
-- This uses auth.jwt() instead of querying profiles table
CREATE POLICY "Admins full access" ON profiles 
FOR ALL TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR
    id = auth.uid()
);

-- ==============================================================================
-- After running this, login should work again!
-- ==============================================================================
