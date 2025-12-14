-- Simplified RLS policies for industries table
-- This version is less strict to allow user suggestions

-- Drop all existing policies
DROP POLICY IF EXISTS "Industries are viewable by everyone" ON industries;
DROP POLICY IF EXISTS "Authenticated users can suggest industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can manage industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can delete industries" ON industries;

-- Enable RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- SELECT: Everyone can see approved industries, users can see their own suggestions
CREATE POLICY "Anyone can view industries"
  ON industries FOR SELECT
  USING (
    is_approved = true
    OR created_by = auth.uid()
  );

-- INSERT: Any authenticated user can suggest industries
CREATE POLICY "Authenticated users can create industries"
  ON industries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only platform admins can update
CREATE POLICY "Only platform admins can update industries"
  ON industries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- DELETE: Only platform admins can delete
CREATE POLICY "Only platform admins can delete industries"
  ON industries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
