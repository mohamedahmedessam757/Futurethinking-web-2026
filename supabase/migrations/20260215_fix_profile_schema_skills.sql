-- Add skills column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    -- Add skills column (array of text) for storing user skills
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills') THEN 
        ALTER TABLE "public"."profiles" ADD COLUMN "skills" TEXT[] DEFAULT '{}'; 
    END IF;

    -- Add title column if it doesn't exist (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'title') THEN 
        ALTER TABLE "public"."profiles" ADD COLUMN "title" TEXT DEFAULT NULL; 
    END IF;

    -- Ensure address column exists (for completeness)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN 
        ALTER TABLE "public"."profiles" ADD COLUMN "address" TEXT DEFAULT NULL; 
    END IF;
END $$;
