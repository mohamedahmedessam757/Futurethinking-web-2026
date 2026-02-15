-- FIX: Allow Images and Videos in ai-course-assets bucket
-- Use this script in Supabase SQL Editor to apply changes immediately.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4']
WHERE name = 'ai-course-assets';

-- Verify the change
SELECT name, allowed_mime_types FROM storage.buckets WHERE name = 'ai-course-assets';
