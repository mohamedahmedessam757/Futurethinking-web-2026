-- ============================================================
-- FUTURE THINKING PLATFORM - SEED DATA
-- Version: 1.0
-- Execute this AFTER schema.sql and rls_policies.sql
-- ============================================================

-- Note: You need to create users through Supabase Auth first
-- Then the trigger will create profiles automatically
-- This script assumes you've created users with these IDs

-- ============================================================
-- SAMPLE DATA (Run with service_role key)
-- ============================================================

-- Insert System Settings
INSERT INTO public.system_settings (id, site_name, maintenance_mode, support_email, allow_registration, total_platform_tokens)
VALUES (1, 'منصة فكر المستقبل', false, 'support@futurethinking.sa', true, 1254000)
ON CONFLICT (id) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    maintenance_mode = EXCLUDED.maintenance_mode;

-- ============================================================
-- INSTRUCTIONS FOR CREATING USERS:
-- ============================================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create:
--    - admin@future.com (password: admin123) with metadata: {"name": "سارة العبدالله", "role": "admin"}
--    - khalid@expert.com (password: consultant123) with metadata: {"name": "د. خالد الفالح", "role": "consultant"}
--    - noura@expert.com (password: consultant123) with metadata: {"name": "أ. نورة الشهري", "role": "consultant"}
--
-- 3. After users are created, run the profile updates below with their actual UUIDs

-- ============================================================
-- UPDATE PROFILES (Replace UUIDs with actual IDs from auth.users)
-- ============================================================
/*
UPDATE public.profiles SET
    title = 'مدير العمليات',
    bio = 'مسؤولة عن جودة المحتوى وإدارة المنصة.',
    subscription_tier = 'enterprise',
    avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200'
WHERE email = 'admin@future.com';

UPDATE public.profiles SET
    title = 'مستشار تخطيط استراتيجي',
    bio = 'خبرة 15 عاماً في قيادة التحول المؤسسي في القطاع الحكومي والخاص.',
    subscription_tier = 'pro',
    avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200'
WHERE email = 'khalid@expert.com';

UPDATE public.profiles SET
    title = 'خبيرة موارد بشرية',
    bio = 'متخصصة في بناء الكفاءات وتطوير القيادات الشابة.',
    subscription_tier = 'pro',
    avatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200'
WHERE email = 'noura@expert.com';
*/

-- ============================================================
-- SAMPLE CONSULTANT PROFILES (Run after users exist)
-- ============================================================
/*
INSERT INTO public.consultant_profiles (user_id, specialization, hourly_rate, rating_average, reviews_count, is_verified)
SELECT id, 'التخطيط الاستراتيجي', 750, 4.9, 124, true
FROM public.profiles WHERE email = 'khalid@expert.com';

INSERT INTO public.consultant_profiles (user_id, specialization, hourly_rate, rating_average, reviews_count, is_verified)
SELECT id, 'الموارد البشرية', 500, 4.8, 85, true
FROM public.profiles WHERE email = 'noura@expert.com';
*/

-- ============================================================
-- SAMPLE COURSES
-- ============================================================
/*
-- Get instructor ID first
DO $$
DECLARE
    v_instructor_id UUID;
BEGIN
    SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'khalid@expert.com';
    
    INSERT INTO public.courses (title, description, instructor_id, instructor_name, price, status, image, level, category, revenue)
    VALUES 
    ('محترف إدارة المشاريع (PMP)', 
     'دورة مكثفة للإعداد لاختبار PMP وفقاً للإصدار السابع من دليل PMBOK.',
     v_instructor_id, 'د. خالد الفالح', 2500, 'active',
     'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800',
     'advanced', 'إدارة المشاريع', 125000),
    
    ('بناء مؤشرات الأداء الرئيسية (KPIs)',
     'تعلم كيف تبني وتتابع مؤشرات الأداء الرئيسية لمؤسستك.',
     v_instructor_id, 'د. خالد الفالح', 1200, 'active',
     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
     'intermediate', 'التخطيط الاستراتيجي', 60000);
END $$;
*/

-- ============================================================
-- SAMPLE BOOKS
-- ============================================================
INSERT INTO public.books (title, author, description, price, cover_image, category, pages, publish_year, status)
VALUES 
('القيادة الإدارية: النظرية والتطبيق',
 'د. عبدالمعطي عساف',
 'مرجع شامل في نظريات القيادة الحديثة وتطبيقاتها في البيئة العربية.',
 150,
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800',
 'القيادة', 320, '2023', 'active'),

('استراتيجية المحيط الأزرق',
 'تشان كيم',
 'كيف تنشئ أسواقاً جديدة وتبتعد عن المنافسة الدموية.',
 85,
 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800',
 'الإدارة', 256, '2015', 'active'),

('العادات السبع للناس الأكثر فعالية',
 'ستيفن كوفي',
 'الكتاب الأكثر مبيعاً في مجال تطوير الذات.',
 60,
 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
 'تطوير الذات', 400, '2020', 'active');
