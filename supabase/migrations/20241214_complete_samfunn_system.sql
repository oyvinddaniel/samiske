-- Complete Samfunn System Migration
-- Oppretter products, services, industries, platform_admins
-- Og oppdaterer communities med nye felt

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  size TEXT,

  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  primary_image TEXT,

  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'NOK',
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'from', 'contact')),

  -- Stock
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,

  -- Contact/Purchase
  purchase_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Search
  search_tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Geography
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  ships_nationally BOOLEAN DEFAULT FALSE,
  ships_internationally BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  UNIQUE(community_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_community ON products(community_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_search_tags ON products USING gin(search_tags);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('norwegian', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('norwegian', description));

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products viewable by everyone" ON products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = products.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Media
  images JSONB DEFAULT '[]'::jsonb,

  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'NOK',
  price_type TEXT DEFAULT 'contact' CHECK (price_type IN ('fixed', 'from', 'hourly', 'contact')),

  -- Contact/Booking
  contact_email TEXT,
  contact_phone TEXT,
  booking_url TEXT,

  -- Search
  search_tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Geography
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  is_online BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  UNIQUE(community_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_community ON services(community_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_search_tags ON services USING gin(search_tags);
CREATE INDEX IF NOT EXISTS idx_services_name_search ON services USING gin(to_tsvector('norwegian', name));
CREATE INDEX IF NOT EXISTS idx_services_description_search ON services USING gin(to_tsvector('norwegian', description));

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services viewable by everyone" ON services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = services.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON services;
CREATE TRIGGER trigger_update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. INDUSTRIES TABLE (Flerspråklige bransjer)
-- ============================================

CREATE TABLE IF NOT EXISTS industries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,

  -- Multilingual names
  name_no TEXT NOT NULL,
  name_sma TEXT,
  name_sju TEXT,
  name_sje TEXT,
  name_smj TEXT,
  name_se TEXT,

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Moderation
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_industries_slug ON industries(slug);
CREATE INDEX IF NOT EXISTS idx_industries_approved ON industries(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_industries_created_at ON industries(created_at DESC);

-- RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries viewable by everyone" ON industries
  FOR SELECT USING (is_approved = TRUE AND is_active = TRUE);

CREATE POLICY "Authenticated users can suggest industries" ON industries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_industries_updated_at ON industries;
CREATE TRIGGER trigger_update_industries_updated_at
  BEFORE UPDATE ON industries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. COMMUNITY_INDUSTRIES (Junction table)
-- ============================================

CREATE TABLE IF NOT EXISTS community_industries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(community_id, industry_id)
);

CREATE INDEX IF NOT EXISTS idx_community_industries_community ON community_industries(community_id);
CREATE INDEX IF NOT EXISTS idx_community_industries_industry ON community_industries(industry_id);

-- RLS
ALTER TABLE community_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community industries viewable by everyone" ON community_industries
  FOR SELECT USING (TRUE);

CREATE POLICY "Community admins can manage industries" ON community_industries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_industries.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. PLATFORM_ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin')) DEFAULT 'admin',

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON platform_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON platform_admins(role);

-- RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins viewable" ON platform_admins
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only owner can manage platform admins" ON platform_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.role = 'owner'
      AND pa.is_active = TRUE
    )
  );

-- Owner protection triggers
CREATE OR REPLACE FUNCTION prevent_owner_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot delete platform owner';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_owner_deletion_trigger ON platform_admins;
CREATE TRIGGER prevent_owner_deletion_trigger
  BEFORE DELETE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_owner_deletion();

CREATE OR REPLACE FUNCTION prevent_owner_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Cannot change owner role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_owner_role_change_trigger ON platform_admins;
CREATE TRIGGER prevent_owner_role_change_trigger
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_owner_role_change();

-- ============================================
-- 6. UPDATE COMMUNITIES TABLE
-- ============================================

DO $$
BEGIN
  -- Add address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'address'
  ) THEN
    ALTER TABLE communities ADD COLUMN address TEXT;
  END IF;

  -- Add phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'phone'
  ) THEN
    ALTER TABLE communities ADD COLUMN phone TEXT;
  END IF;

  -- Add images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'images'
  ) THEN
    ALTER TABLE communities ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================
-- 7. RLS POLICIES FOR INDUSTRIES (after platform_admins exists)
-- ============================================

DROP POLICY IF EXISTS "Platform admins can manage industries" ON industries;
CREATE POLICY "Platform admins can manage industries" ON industries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Platform admins can delete industries" ON industries;
CREATE POLICY "Platform admins can delete industries" ON industries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================
-- 8. SEED INITIAL INDUSTRIES
-- ============================================

CREATE OR REPLACE FUNCTION generate_industry_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[æÆ]', 'ae', 'g'),
          '[øØ]', 'o', 'g'
        ),
        '[åÅ]', 'a', 'g'
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

INSERT INTO industries (slug, name_no, is_approved, is_active)
VALUES
  (generate_industry_slug('Museum'), 'Museum', TRUE, TRUE),
  (generate_industry_slug('Artist & joik'), 'Artist & joik', TRUE, TRUE),
  (generate_industry_slug('Reinkjøtt (salg)'), 'Reinkjøtt (salg)', TRUE, TRUE),
  (generate_industry_slug('Håndverk'), 'Håndverk', TRUE, TRUE),
  (generate_industry_slug('Opplevelser'), 'Opplevelser', TRUE, TRUE),
  (generate_industry_slug('Turarrangør'), 'Turarrangør', TRUE, TRUE),
  (generate_industry_slug('Foredragsholder'), 'Foredragsholder', TRUE, TRUE),
  (generate_industry_slug('Forfatter'), 'Forfatter', TRUE, TRUE),
  (generate_industry_slug('Oversetter'), 'Oversetter', TRUE, TRUE),
  (generate_industry_slug('Kunstner'), 'Kunstner', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION is_platform_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = user_id_param
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_platform_admin_role(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM platform_admins
  WHERE user_id = user_id_param
  AND is_active = TRUE;

  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. COMMENTS
-- ============================================

COMMENT ON TABLE industries IS 'Flerspråklige bransjer for samfunn-kategorisering';
COMMENT ON TABLE community_industries IS 'Kobling mellom communities og industries';
COMMENT ON TABLE platform_admins IS 'Platform administratorer med owner/admin roller';
COMMENT ON TABLE products IS 'Produkter tilbudt av samfunn';
COMMENT ON TABLE services IS 'Tjenester tilbudt av samfunn';

COMMENT ON COLUMN products.search_tags IS 'Synonymer og søkeord (ikke synlig for brukere)';
COMMENT ON COLUMN services.search_tags IS 'Synonymer og søkeord (ikke synlig for brukere)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- MANUAL STEP: Legg til platform owner
-- INSERT INTO platform_admins (user_id, role, is_active)
-- VALUES ('[DIN_USER_ID]', 'owner', TRUE)
-- ON CONFLICT (user_id) DO NOTHING;
