-- Fix profile-covers storage bucket and RLS policies
-- Run this if cover upload is not working

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-covers',
  'profile-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Drop all existing policies
DROP POLICY IF EXISTS "Profile covers are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile cover" ON storage.objects;

-- Allow public viewing of all cover images
CREATE POLICY "Profile covers are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-covers');

-- Allow authenticated users to upload covers
CREATE POLICY "Users can upload their own profile cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own covers
CREATE POLICY "Users can update their own profile cover"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own covers
CREATE POLICY "Users can delete their own profile cover"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
