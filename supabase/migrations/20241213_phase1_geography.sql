-- =====================================================
-- FASE 1: GEOGRAFI-GRUNNMUR
-- Sapmi-plattformen transformasjon
-- =====================================================

-- 1. REGIONS TABLE (Toppniva - Sapmi)
-- =====================================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_sami TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);

-- 2. COUNTRIES TABLE (Land)
-- =====================================================
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_sami TEXT,
  code TEXT NOT NULL UNIQUE,  -- 'NO', 'SE', 'FI', 'RU'
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region_id);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- 3. LANGUAGE_AREAS TABLE (Sprakområder)
-- =====================================================
CREATE TABLE IF NOT EXISTS language_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_sami TEXT,
  code TEXT NOT NULL UNIQUE,  -- 'north', 'south', 'lule', etc.
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_language_areas_region ON language_areas(region_id);
CREATE INDEX IF NOT EXISTS idx_language_areas_code ON language_areas(code);

-- 4. LANGUAGE_AREA_COUNTRIES (Many-to-many: sprakområder krysser landegrenser)
-- =====================================================
CREATE TABLE IF NOT EXISTS language_area_countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  language_area_id UUID NOT NULL REFERENCES language_areas(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(language_area_id, country_id)
);

CREATE INDEX IF NOT EXISTS idx_lac_language_area ON language_area_countries(language_area_id);
CREATE INDEX IF NOT EXISTS idx_lac_country ON language_area_countries(country_id);

-- 5. MUNICIPALITIES TABLE (Kommuner)
-- =====================================================
CREATE TABLE IF NOT EXISTS municipalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  language_area_id UUID REFERENCES language_areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_sami TEXT,
  slug TEXT NOT NULL,
  population INT,
  area_km2 DECIMAL,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_municipalities_country ON municipalities(country_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_language_area ON municipalities(language_area_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_slug ON municipalities(slug);
CREATE INDEX IF NOT EXISTS idx_municipalities_name ON municipalities(name);

-- 6. PLACES TABLE (Steder - byer, bygder, landemerker)
-- =====================================================
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_sami TEXT,
  slug TEXT NOT NULL,
  place_type TEXT DEFAULT 'area' CHECK (place_type IN ('area', 'landmark', 'venue', 'natural')),
  description TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(municipality_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_places_municipality ON places(municipality_id);
CREATE INDEX IF NOT EXISTS idx_places_slug ON places(slug);
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_places_type ON places(place_type);

-- 7. USER_STARRED_MUNICIPALITIES (Brukerens favoritt-kommuner)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_starred_municipalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, municipality_id)
);

CREATE INDEX IF NOT EXISTS idx_usm_user ON user_starred_municipalities(user_id);
CREATE INDEX IF NOT EXISTS idx_usm_municipality ON user_starred_municipalities(municipality_id);

-- 8. USER_STARRED_PLACES (Brukerens favoritt-steder)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_starred_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_usp_user ON user_starred_places(user_id);
CREATE INDEX IF NOT EXISTS idx_usp_place ON user_starred_places(place_id);

-- 9. UTVID PROFILES MED GEOGRAFISKE KOLONNER
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_place_id UUID REFERENCES places(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_place_id UUID REFERENCES places(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_home_municipality ON profiles(home_municipality_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_municipality ON profiles(current_municipality_id);

-- 10. UTVID POSTS MED GEOGRAFISKE KOLONNER
-- =====================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS place_id UUID REFERENCES places(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS geography_scope TEXT DEFAULT 'sapmi' CHECK (geography_scope IN ('place', 'municipality', 'language_area', 'country', 'sapmi'));

CREATE INDEX IF NOT EXISTS idx_posts_municipality ON posts(municipality_id);
CREATE INDEX IF NOT EXISTS idx_posts_place ON posts(place_id);
CREATE INDEX IF NOT EXISTS idx_posts_geography_scope ON posts(geography_scope);

-- 11. ROW LEVEL SECURITY
-- =====================================================

-- Regions: Offentlig lesbart
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regions are viewable by everyone" ON regions FOR SELECT USING (true);
CREATE POLICY "Only admins can modify regions" ON regions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Countries: Offentlig lesbart
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries are viewable by everyone" ON countries FOR SELECT USING (true);
CREATE POLICY "Only admins can modify countries" ON countries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Language Areas: Offentlig lesbart
ALTER TABLE language_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Language areas are viewable by everyone" ON language_areas FOR SELECT USING (true);
CREATE POLICY "Only admins can modify language areas" ON language_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Language Area Countries: Offentlig lesbart
ALTER TABLE language_area_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Language area countries are viewable by everyone" ON language_area_countries FOR SELECT USING (true);
CREATE POLICY "Only admins can modify language area countries" ON language_area_countries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Municipalities: Offentlig lesbart
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Municipalities are viewable by everyone" ON municipalities FOR SELECT USING (true);
CREATE POLICY "Only admins can modify municipalities" ON municipalities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Places: Offentlig lesbart, autentiserte brukere kan opprette
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Places are viewable by everyone" ON places FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create places" ON places FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can modify places" ON places FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete places" ON places FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User Starred Municipalities: Kun egen bruker
ALTER TABLE user_starred_municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own starred municipalities" ON user_starred_municipalities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can star municipalities" ON user_starred_municipalities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unstar municipalities" ON user_starred_municipalities
  FOR DELETE USING (auth.uid() = user_id);

-- User Starred Places: Kun egen bruker
ALTER TABLE user_starred_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own starred places" ON user_starred_places
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can star places" ON user_starred_places
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unstar places" ON user_starred_places
  FOR DELETE USING (auth.uid() = user_id);

-- 12. HELPER FUNCTIONS
-- =====================================================

-- Funksjon for a hente kommune-hierarki (til breadcrumb)
CREATE OR REPLACE FUNCTION get_municipality_hierarchy(municipality_id_param UUID)
RETURNS TABLE (
  municipality_name TEXT,
  municipality_slug TEXT,
  language_area_name TEXT,
  language_area_code TEXT,
  country_name TEXT,
  country_code TEXT,
  region_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.name as municipality_name,
    m.slug as municipality_slug,
    la.name as language_area_name,
    la.code as language_area_code,
    c.name as country_name,
    c.code as country_code,
    r.name as region_name
  FROM municipalities m
  LEFT JOIN language_areas la ON m.language_area_id = la.id
  JOIN countries c ON m.country_id = c.id
  JOIN regions r ON c.region_id = r.id
  WHERE m.id = municipality_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for a hente sted-hierarki (til breadcrumb)
CREATE OR REPLACE FUNCTION get_place_hierarchy(place_id_param UUID)
RETURNS TABLE (
  place_name TEXT,
  place_slug TEXT,
  municipality_name TEXT,
  municipality_slug TEXT,
  language_area_name TEXT,
  language_area_code TEXT,
  country_name TEXT,
  country_code TEXT,
  region_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name as place_name,
    p.slug as place_slug,
    m.name as municipality_name,
    m.slug as municipality_slug,
    la.name as language_area_name,
    la.code as language_area_code,
    c.name as country_name,
    c.code as country_code,
    r.name as region_name
  FROM places p
  JOIN municipalities m ON p.municipality_id = m.id
  LEFT JOIN language_areas la ON m.language_area_id = la.id
  JOIN countries c ON m.country_id = c.id
  JOIN regions r ON c.region_id = r.id
  WHERE p.id = place_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for a hente brukerens stjernemerkede steder
CREATE OR REPLACE FUNCTION get_user_starred_locations(user_id_param UUID)
RETURNS TABLE (
  location_type TEXT,
  location_id UUID,
  location_name TEXT,
  location_slug TEXT,
  municipality_name TEXT,
  country_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Stjernemerkede kommuner
  SELECT
    'municipality'::TEXT as location_type,
    m.id as location_id,
    m.name as location_name,
    m.slug as location_slug,
    NULL::TEXT as municipality_name,
    c.code as country_code
  FROM user_starred_municipalities usm
  JOIN municipalities m ON usm.municipality_id = m.id
  JOIN countries c ON m.country_id = c.id
  WHERE usm.user_id = user_id_param

  UNION ALL

  -- Stjernemerkede steder
  SELECT
    'place'::TEXT as location_type,
    p.id as location_id,
    p.name as location_name,
    p.slug as location_slug,
    m.name as municipality_name,
    c.code as country_code
  FROM user_starred_places usp
  JOIN places p ON usp.place_id = p.id
  JOIN municipalities m ON p.municipality_id = m.id
  JOIN countries c ON m.country_id = c.id
  WHERE usp.user_id = user_id_param

  ORDER BY location_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. REALTIME (valgfritt - for live oppdateringer)
-- =====================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE places;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_starred_places;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_starred_municipalities;
