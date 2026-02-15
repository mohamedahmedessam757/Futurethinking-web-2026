-- ==============================================================================
-- PRODUCTION SECURITY UPGRADE SCRIPT
-- ==============================================================================
-- This script secures the database by enabling Row Level Security (RLS) on ALL tables.
-- It ensures that:
-- 1. Public data (Courses, Books) is readable by everyone.
-- 2. Sensitive data (Transactions, Appointments, Notifications) is restricted to the owner.
-- 3. Admins have full access.
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PROFILES POLICIES (Already partially done, reinforcing)
-- ==============================================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==============================================================================
-- COURSES & LESSONS POLICIES
-- ==============================================================================
-- Courses: Publicly viewable
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- Admin can do everything on courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Lessons: Publicly viewable (or restrict to enrolled? strict mode: restrict to enrolled)
-- For now, consistent with current "Open" design, we allow seeing lesson metadata.
-- Use helper function for enrollment check if we want STRICT access.
-- Let's stick to: Metadata is public, Content (video) is handled by Storage Policies (separate).
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ==============================================================================
-- BOOKS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Books are viewable by everyone" ON public.books;
CREATE POLICY "Books are viewable by everyone" ON public.books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ==============================================================================
-- USER PRIVATE DATA (Transactions, Notifications, Appointments)
-- ==============================================================================

-- Transactions: Users see their own, Admins see all
DROP POLICY IF EXISTS "Users see own transactions" ON public.transactions;
CREATE POLICY "Users see own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all transactions" ON public.transactions;
CREATE POLICY "Admins see all transactions" ON public.transactions FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Notifications: Users see their own
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (
  target_user_id = auth.uid() OR 
  (target_role = 'admin' AND exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
);

-- Appointments: Users see their own (as student or consultant)
DROP POLICY IF EXISTS "Users see own appointments" ON public.appointments;
CREATE POLICY "Users see own appointments" ON public.appointments FOR SELECT USING (
  student_id = auth.uid() OR consultant_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;
CREATE POLICY "Admins see all appointments" ON public.appointments FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ==============================================================================
-- REVIEWS
-- ==============================================================================
-- Reviews: Publicly viewable
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

-- Authenticated users can insert reviews
DROP POLICY IF EXISTS "Auth users can insert reviews" ON public.reviews;
CREATE POLICY "Auth users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- ENROLLMENTS
-- ==============================================================================
DROP POLICY IF EXISTS "Users see own enrollments" ON public.course_enrollments;
CREATE POLICY "Users see own enrollments" ON public.course_enrollments FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins see all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins see all enrollments" ON public.course_enrollments FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Permission Grant (Just in case)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
