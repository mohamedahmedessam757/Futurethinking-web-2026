-- 1. Create 'book-files' bucket for PDF files (Full book & Previews)
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-files', 'book-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'book-covers' bucket for Cover Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS (Usually enabled by default, but good to ensure)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Policies for 'book-files'
-- Allow public read access (for previews)
CREATE POLICY "Public Access book-files"
ON storage.objects FOR SELECT
USING ( bucket_id = 'book-files' );

-- Allow authenticated users (Admin/Consultant) to upload
CREATE POLICY "Auth Upload book-files"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'book-files' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update
CREATE POLICY "Auth Update book-files"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'book-files' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete
CREATE POLICY "Auth Delete book-files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'book-files' AND auth.role() = 'authenticated' );


-- 5. Policies for 'book-covers'
-- Allow public read access
CREATE POLICY "Public Access book-covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'book-covers' );

-- Allow authenticated users to upload
CREATE POLICY "Auth Upload book-covers"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'book-covers' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update
CREATE POLICY "Auth Update book-covers"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'book-covers' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete
CREATE POLICY "Auth Delete book-covers"
ON storage.objects FOR DELETE
USING ( bucket_id = 'book-covers' AND auth.role() = 'authenticated' );
