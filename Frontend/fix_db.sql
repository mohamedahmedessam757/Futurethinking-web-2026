-- Create the AI Drafts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;

-- Create Policy to allow consultants to insert their own drafts
CREATE POLICY "Enable insert for users based on consultant_id" 
ON public.ai_drafts 
FOR INSERT 
WITH CHECK (auth.uid() = consultant_id);

-- Create Policy to allow consultants to view their own drafts
CREATE POLICY "Enable select for users based on consultant_id" 
ON public.ai_drafts 
FOR SELECT 
USING (auth.uid() = consultant_id);

-- Create Policy to allow consultants to delete their own drafts
CREATE POLICY "Enable delete for users based on consultant_id" 
ON public.ai_drafts 
FOR DELETE 
USING (auth.uid() = consultant_id);

-- Grant access to authenticated users
GRANT ALL ON public.ai_drafts TO authenticated;
GRANT ALL ON public.ai_drafts TO service_role;
