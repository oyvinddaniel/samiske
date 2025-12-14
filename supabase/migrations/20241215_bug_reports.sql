-- Bug reports table for technical issues and user feedback
-- Created: 2025-12-15

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reporter
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Bug details
  category TEXT NOT NULL CHECK (category IN ('bug', 'improvement', 'question', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Context (auto-captured)
  url TEXT,
  user_agent TEXT,
  screen_size TEXT,

  -- Screenshot
  screenshot_url TEXT,

  -- Admin triage
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'dismissed')),

  -- Admin metadata
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" ON public.bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON public.bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports" ON public.bug_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports" ON public.bug_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_priority_idx ON public.bug_reports(priority);
CREATE INDEX IF NOT EXISTS bug_reports_category_idx ON public.bug_reports(category);
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx ON public.bug_reports(created_at DESC);

-- Composite index for admin filtering
CREATE INDEX IF NOT EXISTS bug_reports_status_priority_idx ON public.bug_reports(status, priority, created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Comment
COMMENT ON TABLE public.bug_reports IS 'User-reported bugs and technical issues';
