-- ============================================================
-- FUTURE THINKING PLATFORM - STORAGE BUCKETS
-- Version: 1.0
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('course-images', 'course-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('course-videos', 'course-videos', false, 524288000, ARRAY['video/mp4', 'video/webm']),
    ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('book-files', 'book-files', false, 52428800, ARRAY['application/pdf']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('certificates', 'certificates', false, 10485760, ARRAY['application/pdf', 'image/png']),
    ('ai-course-assets', 'ai-course-assets', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- AVATARS (Public bucket)
CREATE POLICY "Avatars are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- COURSE IMAGES (Public bucket)
CREATE POLICY "Course images are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'course-images');

CREATE POLICY "Instructors and admins can manage course images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'course-images' AND (
        public.get_user_role() = 'admin' OR public.get_user_role() = 'consultant'
    ));

-- COURSE VIDEOS (Private bucket - Signed URLs)
CREATE POLICY "Enrolled students can view course videos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'course-videos' AND (
            public.get_user_role() = 'admin'
            OR public.get_user_role() = 'consultant'
            -- Students access via signed URLs generated server-side
        )
    );

CREATE POLICY "Instructors can manage course videos"
    ON storage.objects FOR ALL
    USING (bucket_id = 'course-videos' AND (
        public.get_user_role() = 'admin' OR public.get_user_role() = 'consultant'
    ));

-- BOOK COVERS (Public bucket)
CREATE POLICY "Book covers are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can manage book covers"
    ON storage.objects FOR ALL
    USING (bucket_id = 'book-covers' AND public.get_user_role() = 'admin');

-- BOOK FILES (Private bucket - Signed URLs for purchasers)
CREATE POLICY "Admins can manage book files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'book-files' AND public.get_user_role() = 'admin');

-- CERTIFICATES (Private bucket)
CREATE POLICY "Students can view own certificates"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'certificates' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.get_user_role() = 'admin'
        )
    );

CREATE POLICY "System can create certificates"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'certificates');

-- AI COURSE ASSETS (Public bucket for voice/generated media)
CREATE POLICY "Public read access to ai assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ai-course-assets');

CREATE POLICY "Users can upload ai assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ai-course-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own ai assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'ai-course-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- TRAINING BAGS (Public bucket for source files)
CREATE POLICY "Users can upload training bags"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'training-bags' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own training bags"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'training-bags' AND auth.uid()::text = (storage.foldername(name))[1]);
