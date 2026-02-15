-- ==============================================================================
-- 🛡️ CLEAN COURSES TABLE RLS POLICIES
-- 
-- Problem: Multiple SQL migrations created overlapping/conflicting policies 
-- on the courses table. This clears everything and creates clean policies.
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- ==============================================================================

-- Ensure is_admin() function exists
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
-- STEP 1: Drop ALL existing courses policies (from all migrations)
-- ============================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- From rls_policies.sql
DROP POLICY IF EXISTS "Active courses are publicly viewable" ON courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
DROP POLICY IF EXISTS "Admin full access to courses" ON courses;

-- From ADMIN_RLS_COMPLETE_FIX.sql
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Instructors can view own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;

-- From FIX_COURSE_VISIBILITY.sql
DROP POLICY IF EXISTS "Everyone can view relevant courses" ON courses;
DROP POLICY IF EXISTS "Public can view active courses" ON courses;

-- From FIX_RLS_PUBLISH.sql
DROP POLICY IF EXISTS "Instructors can insert their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can view their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can delete their own courses" ON courses;
DROP POLICY IF EXISTS "Admins have full access" ON courses;

-- Catch-all for any other policies
DROP POLICY IF EXISTS "Instructors can select their own courses" ON courses;

-- ============================================================
-- STEP 2: Create clean policies
-- ============================================================

-- Public (unauthenticated) can see active courses (landing pages)
CREATE POLICY "anon_view_active_courses" ON courses
FOR SELECT TO anon
USING (status = 'active');

-- Authenticated users can see active courses + their own
CREATE POLICY "auth_view_courses" ON courses
FOR SELECT TO authenticated
USING (
  status = 'active'
  OR instructor_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_enrollments.course_id = courses.id
    AND course_enrollments.student_id = auth.uid()
  )
);

-- Instructors can create courses assigned to themselves
CREATE POLICY "instructor_insert_courses" ON courses
FOR INSERT TO authenticated
WITH CHECK (instructor_id = auth.uid() OR is_admin());

-- Instructors can update their own courses
CREATE POLICY "instructor_update_courses" ON courses
FOR UPDATE TO authenticated
USING (instructor_id = auth.uid() OR is_admin())
WITH CHECK (instructor_id = auth.uid() OR is_admin());

-- Instructors can delete their own courses
CREATE POLICY "instructor_delete_courses" ON courses
FOR DELETE TO authenticated
USING (instructor_id = auth.uid() OR is_admin());

-- ============================================================
-- STEP 3: Also fix LESSONS table for publishing
-- ============================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing lessons policies
DROP POLICY IF EXISTS "Lessons viewable by enrolled students or free" ON lessons;
DROP POLICY IF EXISTS "Instructors can manage own lessons" ON lessons;
DROP POLICY IF EXISTS "Admin full access to lessons" ON lessons;
DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Enrolled students can view lessons" ON lessons;
DROP POLICY IF EXISTS "Public can view preview lessons" ON lessons;

-- Clean lessons policies
CREATE POLICY "view_lessons" ON lessons
FOR SELECT TO authenticated
USING (
  is_free = true
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.instructor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_enrollments.course_id = lessons.course_id
    AND course_enrollments.student_id = auth.uid()
  )
);

-- Free lessons visible to public
CREATE POLICY "anon_view_free_lessons" ON lessons
FOR SELECT TO anon
USING (is_free = true);

-- Instructors and admins can manage lessons
CREATE POLICY "manage_lessons" ON lessons
FOR ALL TO authenticated
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.instructor_id = auth.uid()
  )
)
WITH CHECK (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- ==============================================================================
-- ✅ DONE! Test:
--   1. Refresh admin page
--   2. Create new AI course or open existing
--   3. Click "حفظ الكورس"
--   4. Check console — should be clean
-- ==============================================================================
