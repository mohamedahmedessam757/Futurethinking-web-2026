-- ============================================================
-- FUTURE THINKING PLATFORM - ROW LEVEL SECURITY POLICIES
-- Version: 1.0
-- Date: 2026-01-16
-- Execute this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: Get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
-- Anyone can read active profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (status = 'active' OR id = auth.uid() OR public.get_user_role() = 'admin');

-- Users can update own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin can do everything
CREATE POLICY "Admin full access to profiles"
    ON public.profiles FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- CONSULTANT PROFILES POLICIES
-- ============================================================
CREATE POLICY "Consultant profiles are publicly viewable"
    ON public.consultant_profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Consultants can update own profile"
    ON public.consultant_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin full access to consultant_profiles"
    ON public.consultant_profiles FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- CONSULTATION SERVICES POLICIES
-- ============================================================
-- Anyone can read active services
CREATE POLICY "Active services are publicly viewable"
    ON public.consultation_services FOR SELECT
    USING (status = 'active' OR consultant_id = auth.uid() OR public.get_user_role() = 'admin');

-- Consultants can manage own services
CREATE POLICY "Consultants can manage own services"
    ON public.consultation_services FOR ALL
    USING (consultant_id = auth.uid())
    WITH CHECK (consultant_id = auth.uid());

-- Admin can do everything
CREATE POLICY "Admin full access to consultation_services"
    ON public.consultation_services FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- COURSES POLICIES
-- ============================================================
-- Anyone can read active courses
CREATE POLICY "Active courses are publicly viewable"
    ON public.courses FOR SELECT
    USING (status = 'active' OR instructor_id = auth.uid() OR public.get_user_role() = 'admin');

-- Consultants/Instructors can manage own courses
CREATE POLICY "Instructors can manage own courses"
    ON public.courses FOR ALL
    USING (instructor_id = auth.uid() AND public.get_user_role() = 'consultant')
    WITH CHECK (instructor_id = auth.uid());

-- Admin can do everything
CREATE POLICY "Admin full access to courses"
    ON public.courses FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- LESSONS POLICIES
-- ============================================================
-- Free lessons or enrolled students can view
CREATE POLICY "Lessons viewable by enrolled students or free"
    ON public.lessons FOR SELECT
    USING (
        is_free = TRUE
        OR public.get_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.course_enrollments 
            WHERE course_id = lessons.course_id AND student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = lessons.course_id AND instructor_id = auth.uid()
        )
    );

-- Instructors can manage own course lessons
CREATE POLICY "Instructors can manage own lessons"
    ON public.lessons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = lessons.course_id AND instructor_id = auth.uid()
        )
    );

-- Admin full access
CREATE POLICY "Admin full access to lessons"
    ON public.lessons FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- COURSE ENROLLMENTS POLICIES
-- ============================================================
CREATE POLICY "Users can view own enrollments"
    ON public.course_enrollments FOR SELECT
    USING (student_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can enroll in courses"
    ON public.course_enrollments FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can update own progress"
    ON public.course_enrollments FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admin full access to enrollments"
    ON public.course_enrollments FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- BOOKS POLICIES
-- ============================================================
CREATE POLICY "Active books are publicly viewable"
    ON public.books FOR SELECT
    USING (status = 'active' OR public.get_user_role() = 'admin');

CREATE POLICY "Admin full access to books"
    ON public.books FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- BOOK PURCHASES POLICIES
-- ============================================================
CREATE POLICY "Users can view own purchases"
    ON public.book_purchases FOR SELECT
    USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can purchase books"
    ON public.book_purchases FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin full access to purchases"
    ON public.book_purchases FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================
CREATE POLICY "Reviews are publicly viewable"
    ON public.reviews FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Admin can reply to reviews"
    ON public.reviews FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================
CREATE POLICY "Users can view own appointments"
    ON public.appointments FOR SELECT
    USING (
        student_id = auth.uid() 
        OR consultant_id = auth.uid() 
        OR public.get_user_role() = 'admin'
    );

CREATE POLICY "Students can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update appointments"
    ON public.appointments FOR UPDATE
    USING (student_id = auth.uid() OR consultant_id = auth.uid())
    WITH CHECK (student_id = auth.uid() OR consultant_id = auth.uid());

CREATE POLICY "Admin full access to appointments"
    ON public.appointments FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- TRANSACTIONS POLICIES
-- ============================================================
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Only system/server can insert (via service role)
CREATE POLICY "System can create transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (TRUE); -- Controlled by service role key

CREATE POLICY "Admin full access to transactions"
    ON public.transactions FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (
        target_user_id = auth.uid() 
        OR (target_role = 'admin' AND public.get_user_role() = 'admin')
        OR public.get_user_role() = 'admin'
    );

CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE
    USING (target_user_id = auth.uid())
    WITH CHECK (target_user_id = auth.uid());

CREATE POLICY "Admin full access to notifications"
    ON public.notifications FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- CERTIFICATES POLICIES
-- ============================================================
CREATE POLICY "Users can view own certificates"
    ON public.certificates FOR SELECT
    USING (student_id = auth.uid() OR public.get_user_role() = 'admin');

-- Certificates created by system trigger
CREATE POLICY "System can create certificates"
    ON public.certificates FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Admin full access to certificates"
    ON public.certificates FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- AI DRAFTS POLICIES
-- ============================================================
CREATE POLICY "Users can view own drafts"
    ON public.ai_drafts FOR SELECT
    USING (consultant_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can create drafts"
    ON public.ai_drafts FOR INSERT
    WITH CHECK (consultant_id = auth.uid());

CREATE POLICY "Users can update own drafts"
    ON public.ai_drafts FOR UPDATE
    USING (consultant_id = auth.uid());

CREATE POLICY "Users can delete own drafts"
    ON public.ai_drafts FOR DELETE
    USING (consultant_id = auth.uid());

CREATE POLICY "Admin full access to ai_drafts"
    ON public.ai_drafts FOR ALL
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- AI COURSE GENERATIONS POLICIES
-- ============================================================
CREATE POLICY "Users can view own generations"
    ON public.ai_course_generations FOR SELECT
    USING (creator_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can create generations"
    ON public.ai_course_generations FOR INSERT
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own generations"
    ON public.ai_course_generations FOR UPDATE
    USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own generations"
    ON public.ai_course_generations FOR DELETE
    USING (creator_id = auth.uid());

-- ============================================================
-- AI GENERATED LESSONS POLICIES
-- ============================================================
CREATE POLICY "Users can manage own generated lessons"
    ON public.ai_generated_lessons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_course_generations 
            WHERE id = ai_generated_lessons.generation_id 
            AND (creator_id = auth.uid() OR public.get_user_role() = 'admin')
        )
    );

-- ============================================================
-- SYSTEM SETTINGS POLICIES
-- ============================================================
CREATE POLICY "Anyone can read settings"
    ON public.system_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Only admin can update settings"
    ON public.system_settings FOR UPDATE
    USING (public.get_user_role() = 'admin');
