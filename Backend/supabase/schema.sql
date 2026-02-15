-- ============================================================
-- FUTURE THINKING PLATFORM - SUPABASE DATABASE SCHEMA
-- Version: 1.0
-- Date: 2026-01-16
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'consultant')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    avatar TEXT,
    bio TEXT,
    title TEXT,
    join_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم جديد'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CONSULTANT PROFILES TABLE
-- ============================================================
CREATE TABLE public.consultant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    hourly_rate DECIMAL(10, 2) DEFAULT 0,
    intro_video_url TEXT,
    rating_average DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    available_slots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CONSULTATION SERVICES TABLE
-- ============================================================
CREATE TABLE public.consultation_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'draft', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. COURSES TABLE
-- ============================================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL, -- Denormalized for display
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    image TEXT,
    promo_video_url TEXT,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    revenue DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. LESSONS TABLE
-- ============================================================
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT, -- Format: "45:00"
    type TEXT NOT NULL CHECK (type IN ('video', 'quiz', 'reading')),
    is_free BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- AI Generated Content (JSONB fields)
    objectives JSONB DEFAULT '[]'::jsonb,  -- ["objective1", "objective2"]
    script TEXT,                            -- Video script
    slides JSONB DEFAULT '[]'::jsonb,       -- [{title, points: []}]
    quiz_data JSONB DEFAULT '[]'::jsonb,    -- [{question, options, answer, type}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. COURSE ENROLLMENTS TABLE (many-to-many + progress)
-- ============================================================
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(course_id, student_id)
);

-- ============================================================
-- 7. BOOKS TABLE
-- ============================================================
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cover_image TEXT,
    file_url TEXT,        -- Secure Supabase Storage URL
    preview_url TEXT,
    category TEXT,
    pages INTEGER DEFAULT 0,
    publish_year TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. BOOK PURCHASES TABLE (many-to-many)
-- ============================================================
CREATE TABLE public.book_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- ============================================================
-- 9. REVIEWS TABLE (Polymorphic)
-- ============================================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,      -- Denormalized
    user_avatar TEXT,              -- Denormalized
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    admin_reply TEXT,
    
    -- Polymorphic target
    target_type TEXT NOT NULL CHECK (target_type IN ('course', 'book', 'consultant')),
    target_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_reviews_target ON public.reviews(target_type, target_id);

-- ============================================================
-- 10. APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,    -- Denormalized
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consultant_name TEXT NOT NULL, -- Denormalized
    service_id UUID REFERENCES public.consultation_services(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,            -- Format: "10:00 AM"
    type TEXT NOT NULL CHECK (type IN ('video', 'chat')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    preferred_platform TEXT CHECK (preferred_platform IN ('zoom', 'google_meet', 'teams', 'discord')),
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,       -- Denormalized
    
    -- Item reference (polymorphic)
    item_type TEXT NOT NULL CHECK (item_type IN ('course', 'book', 'consultation', 'subscription')),
    item_id UUID,                  -- Reference to course/book/appointment
    item_name TEXT NOT NULL,       -- Description
    
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    payment_method TEXT CHECK (payment_method IN ('Visa', 'Mastercard', 'ApplePay', 'Bank Transfer', 'System')),
    
    -- Moyasar specific fields
    moyasar_payment_id TEXT,
    moyasar_invoice_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user transaction history
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);

-- ============================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT,              -- 'admin' for broadcast to all admins
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('success', 'info', 'warning', 'error')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for unread notifications
CREATE INDEX idx_notifications_unread ON public.notifications(target_user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 13. CERTIFICATES TABLE
-- ============================================================
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,    -- Denormalized
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,    -- Denormalized
    instructor_name TEXT NOT NULL, -- Denormalized
    serial_number TEXT UNIQUE NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. AI DRAFTS TABLE
-- ============================================================
CREATE TABLE public.ai_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('syllabus', 'script', 'quiz', 'resources', 'scenario', 'course')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. AI COURSE GENERATIONS TABLE (Full Course Generation Jobs)
-- ============================================================
CREATE TABLE public.ai_course_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Course Info
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'published')),
    
    -- Settings used
    settings JSONB DEFAULT '{}'::jsonb,  -- {totalDays, unitsCount, lessonsPerUnit, includes...}
    
    -- Source material
    source_content TEXT,                   -- Original training bag content
    source_file_url TEXT,                  -- If uploaded file, stored URL
    extracted_style JSONB DEFAULT '{}'::jsonb,  -- Style extracted from source
    
    -- Generated Structure
    course_structure JSONB DEFAULT '{}'::jsonb,  -- Full course structure with units
    
    -- Progress tracking
    generation_progress JSONB DEFAULT '{}'::jsonb,  -- {phase, completedSteps, totalSteps}
    
    -- Final output
    published_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. AI GENERATED LESSONS TABLE (Lesson-level content)
-- ============================================================
CREATE TABLE public.ai_generated_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES public.ai_course_generations(id) ON DELETE CASCADE,
    
    -- Lesson info
    lesson_id TEXT NOT NULL,              -- Client-side ID (unit-1-lesson-1)
    unit_number INTEGER NOT NULL,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration TEXT,
    
    -- Generated content
    script TEXT,
    script_summary TEXT,
    quiz_data JSONB DEFAULT '[]'::jsonb,
    training_scenarios JSONB DEFAULT '[]'::jsonb,
    
    -- Segmented Content (Text, Audio, Media per segment)
    content_segments JSONB DEFAULT '[]'::jsonb,
    
    -- Media
    voice_url TEXT,
    voice_duration DECIMAL(10, 2),
    video_url TEXT,
    image_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    tokens_used INTEGER DEFAULT 0,
    is_generated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_ai_lessons_generation ON public.ai_generated_lessons(generation_id);
CREATE INDEX idx_ai_course_gen_creator ON public.ai_course_generations(creator_id);

-- ============================================================
-- 15. SYSTEM SETTINGS TABLE (Singleton)
-- ============================================================
CREATE TABLE public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures single row
    site_name TEXT DEFAULT 'منصة فكر المستقبل',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    support_email TEXT DEFAULT 'support@futurethinking.sa',
    allow_registration BOOLEAN DEFAULT TRUE,
    total_platform_tokens INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultant_profiles_updated_at BEFORE UPDATE ON consultant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_services_updated_at BEFORE UPDATE ON consultation_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
