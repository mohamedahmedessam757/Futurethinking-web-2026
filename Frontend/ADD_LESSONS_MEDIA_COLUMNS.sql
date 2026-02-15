/* 
 * MIGRATION: ADD MISSING MEDIA COLUMNS TO PUBLIC.LESSONS
 * 
 * This script adds the necessary columns to the 'lessons' table to support 
 * AI-generated media (voice, images, segments) when a course is published.
 * 
 * usage: Run this in Supabase SQL Editor
 */

-- 1. Add Voice URL (for AI voiceovers)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- 2. Add Voice Duration (in seconds)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS voice_duration NUMERIC;

-- 3. Add Image URLs (array of images)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- 4. Add Content Segments (Structured content blocks)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS content_segments JSONB DEFAULT '[]'::jsonb;

-- 5. Add Training Scenarios (AI generated scenarios)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS training_scenarios JSONB DEFAULT '[]'::jsonb;

-- 6. Add Indexes for better performance on JSONB columns if needed (Optional but good practice)
CREATE INDEX IF NOT EXISTS idx_lessons_content_segments ON public.lessons USING gin (content_segments);
CREATE INDEX IF NOT EXISTS idx_lessons_training_scenarios ON public.lessons USING gin (training_scenarios);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name IN ('voice_url', 'voice_duration', 'image_urls', 'content_segments', 'training_scenarios');
