-- Create storage bucket for bug screenshots
-- Created: 2025-12-15

-- Insert bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for bug-screenshots bucket

-- Users can upload screenshots (authenticated only)
CREATE POLICY "Users can upload bug screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bug-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own screenshots
CREATE POLICY "Users can view own bug screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bug-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all screenshots
CREATE POLICY "Admins can view all bug screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bug-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Users can delete their own screenshots
CREATE POLICY "Users can delete own bug screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bug-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment
COMMENT ON TABLE storage.buckets IS 'Storage bucket for bug report screenshots (max 5MB, images only)';
