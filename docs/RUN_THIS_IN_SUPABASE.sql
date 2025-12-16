-- ============================================================================
-- KJØR DENNE SQL-EN I SUPABASE DASHBOARD → SQL EDITOR
-- ============================================================================
-- Dette vil opprette bug_reports tabellen og storage bucket
-- slik at bug-rapporter fra brukere vises i admin-panelet
-- ============================================================================

-- 1. OPPRETT BUG_REPORTS TABELL
-- ============================================================================

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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Users can view own bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;

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
CREATE INDEX IF NOT EXISTS bug_reports_status_priority_idx ON public.bug_reports(status, priority, created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bug_reports_updated_at ON public.bug_reports;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

COMMENT ON TABLE public.bug_reports IS 'User-reported bugs and technical issues';


-- 2. OPPRETT STORAGE BUCKET FOR SKJERMBILDER
-- ============================================================================

-- Insert bucket (ignore if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own bug screenshots" ON storage.objects;

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


-- ============================================================================
-- FERDIG!
-- ============================================================================
-- Nå kan du:
-- 1. Gå til admin-panelet (samiske.no/admin)
-- 2. Klikk på "Bug-rapporter" fanen
-- 3. Se alle innsendte bug-rapporter fra brukere
-- ============================================================================
