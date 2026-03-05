-- Storage Setup for Sphere
-- Run this in the Supabase SQL Editor to set up buckets for avatars and attachments

-- 1. Create the 'avatars' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'attachments' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS Policies for Avatars
-- Allow public read access to avatars
CREATE POLICY "Public Access Avatars" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Auth Users Upload Avatars" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow users to update/delete their own avatars
CREATE POLICY "Auth Users Update Avatars" ON storage.objects 
FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Users Delete Avatars" ON storage.objects 
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');


-- 4. Set up RLS Policies for Attachments
-- Allow public read access to attachments
CREATE POLICY "Public Access Attachments" ON storage.objects 
FOR SELECT USING (bucket_id = 'attachments');

-- Allow authenticated users to upload attachments
CREATE POLICY "Auth Users Upload Attachments" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
