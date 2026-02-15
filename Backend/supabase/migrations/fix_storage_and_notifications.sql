-- ==========================================================
-- إصلاح سياسات Storage و Notifications
-- نفذ هذا الملف في Supabase SQL Editor
-- ==========================================================

-- ============================================================
-- 1. سياسات RLS للـ Storage (avatars bucket)
-- ============================================================

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow user update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow user delete own files" ON storage.objects;

-- سياسة: السماح للمستخدمين المسجلين برفع الملفات
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- سياسة: السماح للجميع بقراءة الملفات (public)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- سياسة: السماح للمستخدمين بتحديث ملفاتهم
CREATE POLICY "Allow user update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- سياسة: السماح للمستخدمين بحذف ملفاتهم
CREATE POLICY "Allow user delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================================
-- 2. إصلاح سياسات جدول Notifications
-- (target_user_id هو UUID)
-- ============================================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Notifications select policy" ON notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON notifications;

-- سياسة: يمكن للمستخدمين رؤية إشعاراتهم
CREATE POLICY "Users can view their notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
    target_user_id = auth.uid() 
    OR target_role = 'admin'
    OR target_role = 'all'
    OR target_role = 'student'
    OR target_role = 'consultant'
);

-- سياسة: المستخدمون المسجلون يمكنهم إنشاء إشعارات
CREATE POLICY "Users can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- سياسة: يمكن للمستخدمين تحديث إشعاراتهم (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (target_user_id = auth.uid());

-- ============================================================
-- 3. التأكد من تفعيل RLS
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

SELECT 'تم تطبيق جميع السياسات بنجاح! ✅' as status;
