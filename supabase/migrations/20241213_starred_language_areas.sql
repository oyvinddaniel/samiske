-- User starred language areas
-- Created: 2025-12-13

CREATE TABLE IF NOT EXISTS user_starred_language_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_area_id UUID NOT NULL REFERENCES language_areas(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_area_id)
);

CREATE INDEX IF NOT EXISTS idx_usla_user ON user_starred_language_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_usla_language_area ON user_starred_language_areas(language_area_id);

-- Enable RLS
ALTER TABLE user_starred_language_areas ENABLE ROW LEVEL SECURITY;

-- Users can view their own starred language areas
CREATE POLICY "Users can view own starred language areas" ON user_starred_language_areas
  FOR SELECT USING (auth.uid() = user_id);

-- Users can star language areas
CREATE POLICY "Users can star language areas" ON user_starred_language_areas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unstar language areas
CREATE POLICY "Users can unstar language areas" ON user_starred_language_areas
  FOR DELETE USING (auth.uid() = user_id);
