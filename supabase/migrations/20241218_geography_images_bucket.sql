-- Create storage bucket for geography images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'geography-images',
  'geography-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload geography images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'geography-images');

-- Allow public read access
CREATE POLICY "Public can view geography images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'geography-images');

-- Allow users to delete their own uploads (optional)
CREATE POLICY "Users can delete their own geography images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'geography-images' AND auth.uid()::text = (storage.foldername(name))[3]);
