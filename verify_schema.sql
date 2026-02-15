-- SQL Script to Verify and Update AI Course Creator Schema
-- Run this in your Supabase SQL Editor

-- 1. Ensure `ai_course_generations` has all required columns
DO $$
BEGIN
    -- Add source_file_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'source_file_url') THEN
        ALTER TABLE ai_course_generations ADD COLUMN source_file_url TEXT;
    END IF;

    -- Add source_content if it doesn't exist (to store the raw parsed text)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'source_content') THEN
        ALTER TABLE ai_course_generations ADD COLUMN source_content TEXT;
    END IF;

    -- Add settings if it doesn't exist (to store toggles like includeVoice, includeVideo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'settings') THEN
        ALTER TABLE ai_course_generations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add generation_progress if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'generation_progress') THEN
        ALTER TABLE ai_course_generations ADD COLUMN generation_progress JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Ensure `ai_generated_lessons` has content_segments
DO $$
BEGIN
    -- Add content_segments to store the editable blocks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_generated_lessons' AND column_name = 'content_segments') THEN
        ALTER TABLE ai_generated_lessons ADD COLUMN content_segments JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add voice_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_generated_lessons' AND column_name = 'voice_url') THEN
        ALTER TABLE ai_generated_lessons ADD COLUMN voice_url TEXT;
    END IF;

    -- Add image_urls if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_generated_lessons' AND column_name = 'image_urls') THEN
        ALTER TABLE ai_generated_lessons ADD COLUMN image_urls TEXT[];
    END IF;
    
    -- Add video_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_generated_lessons' AND column_name = 'video_url') THEN
        ALTER TABLE ai_generated_lessons ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- 3. Verify RLS Policies (Optional but Recommended)
-- Ensure authenticated users can insert/update their own generations
-- (This part assumes standard RLS setup; modifying only if needed)
