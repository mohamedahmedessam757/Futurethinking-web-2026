-- ==============================================================================
-- Supabase Row Level Security (RLS) Setup for Future Thinking Platform
-- UPDATED: Added comprehensive Admin policies for all tables
-- ==============================================================================

-- 1. COURSES TABLE
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active courses" ON courses;
CREATE POLICY "Public can view active courses" ON courses FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
CREATE POLICY "Admins can view all courses" ON courses FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 2. CONSULTANT PROFILES TABLE
ALTER TABLE consultant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view consultant profiles" ON consultant_profiles;
CREATE POLICY "Public can view consultant profiles" ON consultant_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Consultants can update own profile" ON consultant_profiles;
CREATE POLICY "Consultants can update own profile" ON consultant_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can insert own profile" ON consultant_profiles;
CREATE POLICY "Consultants can insert own profile" ON consultant_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. CONSULTATION SERVICES TABLE
ALTER TABLE consultation_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active services" ON consultation_services;
CREATE POLICY "Public can view active services" ON consultation_services FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Consultants can view own services" ON consultation_services;
CREATE POLICY "Consultants can view own services" ON consultation_services FOR SELECT TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can create services" ON consultation_services;
CREATE POLICY "Consultants can create services" ON consultation_services FOR INSERT TO authenticated WITH CHECK (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can update own services" ON consultation_services;
CREATE POLICY "Consultants can update own services" ON consultation_services FOR UPDATE TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can delete own services" ON consultation_services;
CREATE POLICY "Consultants can delete own services" ON consultation_services FOR DELETE TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all services" ON consultation_services;
CREATE POLICY "Admins can view all services" ON consultation_services FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all services" ON consultation_services;
CREATE POLICY "Admins can manage all services" ON consultation_services FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. PROFILES TABLE (CRITICAL FIX: Admin must see ALL users)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view consultant basic info" ON profiles;
CREATE POLICY "Public can view consultant basic info" ON profiles FOR SELECT USING (
  role = 'consultant' OR role = 'admin' OR id = auth.uid()
);

-- NEW: Admin can view ALL profiles (students, consultants, everyone)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 5. COURSE ENROLLMENTS TABLE
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
CREATE POLICY "Students can view own enrollments" ON course_enrollments FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all enrollments" ON course_enrollments;
CREATE POLICY "Admins can view all enrollments" ON course_enrollments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 6. APPOINTMENTS TABLE
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view own appointments" ON appointments;
CREATE POLICY "Consultants can view own appointments" ON appointments FOR SELECT TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR consultant_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update appointments" ON appointments;
CREATE POLICY "Participants can update appointments" ON appointments FOR UPDATE TO authenticated USING (student_id = auth.uid() OR consultant_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 7. TRANSACTIONS TABLE
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;
CREATE POLICY "Admins can manage all transactions" ON transactions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 8. AI DRAFTS TABLE
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view own drafts" ON ai_drafts;
CREATE POLICY "Consultants can view own drafts" ON ai_drafts FOR SELECT TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can create drafts" ON ai_drafts;
CREATE POLICY "Consultants can create drafts" ON ai_drafts FOR INSERT TO authenticated WITH CHECK (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can update own drafts" ON ai_drafts;
CREATE POLICY "Consultants can update own drafts" ON ai_drafts FOR UPDATE TO authenticated USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Consultants can delete own drafts" ON ai_drafts;
CREATE POLICY "Consultants can delete own drafts" ON ai_drafts FOR DELETE TO authenticated USING (consultant_id = auth.uid());

-- 9. BOOKS TABLE (NEW - Critical for Admin Library Management)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active books" ON books;
CREATE POLICY "Public can view active books" ON books FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can view all books" ON books;
CREATE POLICY "Admins can view all books" ON books FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all books" ON books;
CREATE POLICY "Admins can manage all books" ON books FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 10. REVIEWS TABLE
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all reviews" ON reviews;
CREATE POLICY "Public can view all reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 11. NOTIFICATIONS TABLE
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (
  target_user_id = auth.uid() OR target_role = 'admin'
);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (target_user_id = auth.uid());

-- 12. LESSONS TABLE  
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
CREATE POLICY "Public can view lessons" ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 13. CERTIFICATES TABLE
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Public can verify certificates" ON certificates;
CREATE POLICY "Public can verify certificates" ON certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;
CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

