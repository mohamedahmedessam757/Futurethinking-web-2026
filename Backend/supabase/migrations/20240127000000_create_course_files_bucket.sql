-- Create a storage bucket for course files
insert into storage.buckets
  (id, name, public)
values
  ('course-files', 'course-files', true)
on conflict (id) do nothing;

-- Set up RLS policies for the bucket (allow public access for demo purposes, restrict in prod)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'course-files' );

create policy "Authenticated Users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'course-files' AND auth.role() = 'authenticated' );

create policy "Users can update own files"
  on storage.objects for update
  using ( bucket_id = 'course-files' AND auth.uid() = owner )
  with check ( bucket_id = 'course-files' AND auth.uid() = owner );
