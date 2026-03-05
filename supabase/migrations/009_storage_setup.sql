-- Setup Storage Buckets for Sphere
-- This ensures 'avatars' and 'attachments' buckets exist and are public

-- 1. Create buckets (ignoring if they already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage
-- Note: Supabase usually enables RLS on storage.objects by default.
-- If you get an error that RLS is not enabled, please enable it in the Supabase Dashboard.

-- Clean up existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Manage Own Uploads" ON storage.objects;

-- Allow public read access to all objects in these buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('avatars', 'attachments') );

-- Allow authenticated users to upload to these buckets
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('avatars', 'attachments') );

-- Allow users to manage their own uploads
CREATE POLICY "Manage Own Uploads"
ON storage.objects FOR ALL
TO authenticated
USING ( auth.uid()::text = owner::text )
WITH CHECK ( auth.uid()::text = owner::text );
