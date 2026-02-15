-- ==============================================================================
-- 🛠️ FIX COURSE VISIBILITY & ACCESS (RLS POLICY UPDATE)
-- Run this script in Supabase SQL Editor to allow students to see their enrolled courses
-- ==============================================================================

-- 1. Enable RLS on courses table (just in case)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Enrolled students can view their courses" ON courses;

-- 3. Create a comprehensive policy for VIEWING courses
-- This allows access if:
-- A) The course is 'active' (Publicly visible)
-- B) The user is enrolled in the course (Even if it's not active/archived)
-- C) The user is the instructor
-- D) The user is an admin
CREATE POLICY "Everyone can view relevant courses" ON courses
FOR SELECT TO authenticated
USING (
  status = 'active' OR
  EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_enrollments.course_id = courses.id 
    AND course_enrollments.student_id = auth.uid()
  ) OR
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Ensure Public (unauthenticated) can still see active courses (for landing pages)
CREATE POLICY "Public can view active courses" ON courses
FOR SELECT TO anon
USING (status = 'active');

-- ==============================================================================
-- 5. Fix Course Enrollments Visibility
-- ==============================================================================
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
CREATE POLICY "Students can view own enrollments" ON course_enrollments
FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- ==============================================================================
-- 6. Fix Lessons Visibility (So they can see content)
-- ==============================================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled students can view lessons" ON lessons;
CREATE POLICY "Enrolled students can view lessons" ON lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_enrollments.course_id = lessons.course_id
    AND course_enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.instructor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure public/preview lessons are visible if the course is active (optional, for trial lessons)
CREATE POLICY "Public can view preview lessons" ON lessons
FOR SELECT
USING (is_free = true);
