-- Fix RLS policies for industries table (v3 - idempotent version)
-- This version is safe to run multiple times

-- Drop ALL possible policy names that might exist
DROP POLICY IF EXISTS "Industries are viewable by everyone" ON industries;
DROP POLICY IF EXISTS "Anyone can view industries" ON industries;
DROP POLICY IF EXISTS "Authenticated users can suggest industries" ON industries;
DROP POLICY IF EXISTS "Authenticated users can create industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can manage industries" ON industries;
DROP POLICY IF EXISTS "Only platform admins can update industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can delete industries" ON industries;
DROP POLICY IF EXISTS "Only platform admins can delete industries" ON industries;

-- Enable RLS (safe to run multiple times)
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- SELECT: Everyone can see approved industries, users can see their own suggestions
CREATE POLICY "Anyone can view industries"
  ON industries FOR SELECT
  USING (
    is_approved = true
    OR created_by = auth.uid()
  );

-- INSERT: Any authenticated user can suggest industries (WITH CHECK is critical!)
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
