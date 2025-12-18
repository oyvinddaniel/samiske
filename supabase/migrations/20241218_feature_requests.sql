-- Feature requests table for user suggestions and ideas
-- Created: 2025-12-18

CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Requester (nullable for anonymity display, but stored for admin)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Request details
  title TEXT NOT NULL,
  description TEXT,

  -- Admin triage
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'rejected', 'on_hold')),
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create feature requests
CREATE POLICY "Users can create feature requests" ON public.feature_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Everyone can view recent feature requests (anonymous - no user_id exposed)
-- This is handled in the query by selecting only id, title, description, status, created_at
CREATE POLICY "Anyone can view feature requests" ON public.feature_requests
  FOR SELECT USING (true);

-- Admins can update feature requests
CREATE POLICY "Admins can update feature requests" ON public.feature_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete feature requests
CREATE POLICY "Admins can delete feature requests" ON public.feature_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS feature_requests_user_id_idx ON public.feature_requests(user_id);
CREATE INDEX IF NOT EXISTS feature_requests_status_idx ON public.feature_requests(status);
CREATE INDEX IF NOT EXISTS feature_requests_created_at_idx ON public.feature_requests(created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_requests_updated_at();

-- Comment
COMMENT ON TABLE public.feature_requests IS 'User feature requests and suggestions - displayed anonymously but tracked for admin';
