-- Add parsed_data column to ai_course_generations table
-- This is required to save the AI-parsed structure of the training bag so it can be restored without re-parsing.

DO $$
BEGIN
    -- Add parsed_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'parsed_data') THEN
        ALTER TABLE ai_course_generations ADD COLUMN parsed_data JSONB;
    END IF;

    -- Ensure source_file_url column exists (usually it does but might check to be safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_course_generations' AND column_name = 'source_file_url') THEN
        ALTER TABLE ai_course_generations ADD COLUMN source_file_url TEXT;
    END IF;
END $$;
