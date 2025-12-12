-- Feedback table for user suggestions
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Only admins can view feedback"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX feedback_created_at_idx ON public.feedback(created_at DESC);
