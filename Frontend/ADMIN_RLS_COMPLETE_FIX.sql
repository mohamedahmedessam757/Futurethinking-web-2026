-- ==============================================================================
-- 🛡️ COMPREHENSIVE ADMIN RLS FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- ==============================================================================

-- ============================================================
-- STEP 1: Create Security Definer Function (CRITICAL)
-- This function bypasses RLS to check admin status
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- STEP 2: PROFILES TABLE (المستخدمين)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Public can view consultant basic info" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins full access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON profiles;

-- New policies (non-recursive)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Public can view public profiles" ON profiles
FOR SELECT
USING (role IN ('consultant', 'admin'));

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage profiles" ON profiles
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- STEP 3: COURSES TABLE (الدورات)
-- ============================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Instructors can view own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;

-- New policies
CREATE POLICY "Public can view active courses" ON courses
FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can view all courses" ON courses
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage courses" ON courses
FOR ALL TO authenticated
USING (is_admin());

-- Instructors can view/manage own courses
CREATE POLICY "Instructors can view own courses" ON courses
FOR SELECT TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can manage own courses" ON courses
FOR ALL TO authenticated
USING (instructor_id = auth.uid());

-- ============================================================
-- STEP 4: BOOKS TABLE (الكتب)
-- ============================================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Public can view active books" ON books;
DROP POLICY IF EXISTS "Admins can view all books" ON books;
DROP POLICY IF EXISTS "Admins can manage all books" ON books;
DROP POLICY IF EXISTS "Admins can manage books" ON books;

-- New policies
CREATE POLICY "Public can view active books" ON books
FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can view all books" ON books
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage books" ON books
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- STEP 5: CONSULTATION_SERVICES TABLE (الاستشارات)
-- ============================================================

ALTER TABLE consultation_services ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Public can view active services" ON consultation_services;
DROP POLICY IF EXISTS "Consultants can view own services" ON consultation_services;
DROP POLICY IF EXISTS "Consultants can create services" ON consultation_services;
DROP POLICY IF EXISTS "Consultants can update own services" ON consultation_services;
DROP POLICY IF EXISTS "Consultants can delete own services" ON consultation_services;
DROP POLICY IF EXISTS "Admins can view all services" ON consultation_services;
DROP POLICY IF EXISTS "Admins can manage all services" ON consultation_services;
DROP POLICY IF EXISTS "Admins can manage services" ON consultation_services;

-- New policies
CREATE POLICY "Public can view active services" ON consultation_services
FOR SELECT
USING (status = 'active');

CREATE POLICY "Consultants can view own services" ON consultation_services
FOR SELECT TO authenticated
USING (consultant_id = auth.uid());

CREATE POLICY "Consultants can create services" ON consultation_services
FOR INSERT TO authenticated
WITH CHECK (consultant_id = auth.uid());

CREATE POLICY "Consultants can update own services" ON consultation_services
FOR UPDATE TO authenticated
USING (consultant_id = auth.uid());

CREATE POLICY "Consultants can delete own services" ON consultation_services
FOR DELETE TO authenticated
USING (consultant_id = auth.uid());

CREATE POLICY "Admins can view all services" ON consultation_services
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage services" ON consultation_services
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- STEP 6: TRANSACTIONS TABLE (المدفوعات)
-- ============================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON transactions;

-- New policies
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage transactions" ON transactions
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- STEP 7: Additional Tables (للتأكد من عدم وجود مشاكل)
-- ============================================================

-- APPOINTMENTS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Participants can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;

CREATE POLICY "Consultants can view own appointments" ON appointments
FOR SELECT TO authenticated
USING (consultant_id = auth.uid());

CREATE POLICY "Users can view own appointments" ON appointments
FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Users can create appointments" ON appointments
FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid() OR consultant_id = auth.uid());

CREATE POLICY "Participants can update appointments" ON appointments
FOR UPDATE TO authenticated
USING (student_id = auth.uid() OR consultant_id = auth.uid());

CREATE POLICY "Admins can view all appointments" ON appointments
FOR SELECT TO authenticated
USING (is_admin());

-- COURSE ENROLLMENTS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON course_enrollments;

CREATE POLICY "Students can view own enrollments" ON course_enrollments
FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins can view all enrollments" ON course_enrollments
FOR SELECT TO authenticated
USING (is_admin());

-- LESSONS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

CREATE POLICY "Public can view lessons" ON lessons
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage lessons" ON lessons
FOR ALL TO authenticated
USING (is_admin());

-- REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

CREATE POLICY "Public can view all reviews" ON reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews" ON reviews
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage reviews" ON reviews
FOR ALL TO authenticated
USING (is_admin());

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT TO authenticated
USING (target_user_id = auth.uid() OR target_role = 'admin');

CREATE POLICY "System can create notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE TO authenticated
USING (target_user_id = auth.uid());

-- ==============================================================================
-- ✅ DONE! Refresh your admin pages to see the data
-- ==============================================================================
