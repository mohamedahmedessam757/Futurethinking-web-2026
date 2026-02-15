-- ==============================================================================
-- 🛡️ FIX AI COURSE RLS POLICIES (COMPREHENSIVE)
-- 
-- Problem: Admin cannot save AI-generated lessons or publish courses.
-- Root Cause: 
--   1. Old "FOR ALL" policy on ai_generated_lessons (from rls_policies.sql) 
--      was never dropped — it blocks INSERT because USING-only FOR ALL 
--      fails for new rows.
--   2. No is_admin() override policies on AI tables.
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- ==============================================================================

-- ============================================================
-- STEP 1: Ensure is_admin() function exists
-- (Already created by ADMIN_RLS_COMPLETE_FIX.sql, but safe to re-create)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- STEP 2: AI COURSE GENERATIONS TABLE
-- Drop ALL existing policies (old + new names)
-- ============================================================
ALTER TABLE ai_course_generations ENABLE ROW LEVEL SECURITY;

-- Drop old policies from rls_policies.sql
DROP POLICY IF EXISTS "Users can view own generations" ON ai_course_generations;
DROP POLICY IF EXISTS "Users can create generations" ON ai_course_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON ai_course_generations;
DROP POLICY IF EXISTS "Users can delete own generations" ON ai_course_generations;

-- Drop policies from previously executed fix script
DROP POLICY IF EXISTS "Users can insert own generations" ON ai_course_generations;

-- Drop any admin policies that might exist
DROP POLICY IF EXISTS "Admin full access to generations" ON ai_course_generations;
DROP POLICY IF EXISTS "Admins full access to ai_course_generations" ON ai_course_generations;

-- Create clean policies
CREATE POLICY "Users can view own generations" ON ai_course_generations
FOR SELECT TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Users can insert own generations" ON ai_course_generations
FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own generations" ON ai_course_generations
FOR UPDATE TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own generations" ON ai_course_generations
FOR DELETE TO authenticated
USING (creator_id = auth.uid());

-- ⭐ ADMIN OVERRIDE (was missing!)
CREATE POLICY "Admin full access to ai_course_generations" ON ai_course_generations
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================
-- STEP 3: AI GENERATED LESSONS TABLE
-- Drop ALL existing policies (old + new names)
-- ============================================================
ALTER TABLE ai_generated_lessons ENABLE ROW LEVEL SECURITY;

-- ⚠️ CRITICAL: Drop the OLD "FOR ALL" policy from rls_policies.sql
-- This policy was NEVER dropped by the previous fix script!
DROP POLICY IF EXISTS "Users can manage own generated lessons" ON ai_generated_lessons;

-- Drop policies from previously executed fix script
DROP POLICY IF EXISTS "Users can view own lessons" ON ai_generated_lessons;
DROP POLICY IF EXISTS "Users can insert own lessons" ON ai_generated_lessons;
DROP POLICY IF EXISTS "Users can update own lessons" ON ai_generated_lessons;
DROP POLICY IF EXISTS "Users can delete own lessons" ON ai_generated_lessons;

-- Drop any admin policies that might exist
DROP POLICY IF EXISTS "Admin full access to lessons" ON ai_generated_lessons;
DROP POLICY IF EXISTS "Admins full access to ai_generated_lessons" ON ai_generated_lessons;

-- Create clean policies (separate operations for safety)
CREATE POLICY "Users can view own lessons" ON ai_generated_lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_course_generations
    WHERE ai_course_generations.id = ai_generated_lessons.generation_id
    AND ai_course_generations.creator_id = auth.uid()
  )
);

-- ⭐ KEY FIX: Separate INSERT policy with WITH CHECK
CREATE POLICY "Users can insert own lessons" ON ai_generated_lessons
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_course_generations
    WHERE ai_course_generations.id = generation_id
    AND ai_course_generations.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update own lessons" ON ai_generated_lessons
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_course_generations
    WHERE ai_course_generations.id = ai_generated_lessons.generation_id
    AND ai_course_generations.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own lessons" ON ai_generated_lessons
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_course_generations
    WHERE ai_course_generations.id = ai_generated_lessons.generation_id
    AND ai_course_generations.creator_id = auth.uid()
  )
);

-- ⭐ ADMIN OVERRIDE (was missing!)
CREATE POLICY "Admin full access to ai_generated_lessons" ON ai_generated_lessons
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================================================
-- ✅ DONE!
-- After running this script:
--   1. Refresh the admin page
--   2. Try creating a new AI course
--   3. Check console — no more 42501 or PGRST116 errors
-- ==============================================================================
