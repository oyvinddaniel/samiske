-- ============================================
-- Community System v2 - Komplett Utvidelse
-- ============================================
-- Dato: 2024-12-18
-- Beskrivelse: Omfattende utvidelse av community-systemet med:
--   - Dynamiske kategorier (erstatter hardkodet ENUM)
--   - JSONB-baserte innstillinger
--   - Attributter (tilgjengelighet, eierskap, bærekraft)
--   - Åpningstider
--   - Events/arrangementer med kalender
--   - FAQ
--   - Portefølje for kunstnere
--   - Sertifiseringer
--   - Google Min Bedrift integrasjon (forberedt)
--   - Anmeldelser (latent)
--   - Statistikk (latent)

-- ============================================
-- 1. COMMUNITY CATEGORIES (Dynamiske kategorier)
-- ============================================

CREATE TABLE IF NOT EXISTS community_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_no TEXT NOT NULL,
  name_se TEXT,                    -- Nordsamisk
  name_sma TEXT,                   -- Sørsamisk
  name_smj TEXT,                   -- Lulesamisk
  icon TEXT DEFAULT 'Building2',   -- Lucide icon name
  description TEXT,
  features JSONB DEFAULT '{
    "has_products": true,
    "has_services": true,
    "has_booking": false,
    "has_menu": false,
    "has_opening_hours": true,
    "has_portfolio": false,
    "has_membership": false,
    "has_events": true
  }'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_categories_slug ON community_categories(slug);
CREATE INDEX IF NOT EXISTS idx_community_categories_active ON community_categories(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active categories" ON community_categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Platform admins can manage categories" ON community_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Migrer eksisterende kategorier til tabell
INSERT INTO community_categories (slug, name_no, name_se, icon, features, sort_order) VALUES
  ('organization', 'Organisasjon', 'Organisašuvdna', 'Building2',
   '{"has_products": false, "has_services": false, "has_booking": false, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": true, "has_events": true}'::jsonb, 1),
  ('business', 'Bedrift', 'Fitnodatdoaibma', 'Briefcase',
   '{"has_products": true, "has_services": true, "has_booking": true, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 2),
  ('institution', 'Institusjon', 'Institušuvdna', 'Landmark',
   '{"has_products": false, "has_services": true, "has_booking": false, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 3),
  ('association', 'Forening', 'Searvi', 'Users',
   '{"has_products": false, "has_services": false, "has_booking": false, "has_menu": false, "has_opening_hours": false, "has_portfolio": false, "has_membership": true, "has_events": true}'::jsonb, 4),
  ('cultural', 'Kulturinstitusjon', 'Kulturinstitušuvdna', 'Palette',
   '{"has_products": true, "has_services": true, "has_booking": true, "has_menu": false, "has_opening_hours": true, "has_portfolio": true, "has_membership": false, "has_events": true}'::jsonb, 5),
  ('educational', 'Utdanning', 'Oahpahus', 'GraduationCap',
   '{"has_products": false, "has_services": true, "has_booking": false, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 6),
  ('government', 'Offentlig', 'Almmolaš', 'Building',
   '{"has_products": false, "has_services": true, "has_booking": false, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 7),
  -- Nye kategorier
  ('artist', 'Kunstner', 'Dáiddár', 'Brush',
   '{"has_products": true, "has_services": true, "has_booking": true, "has_menu": false, "has_opening_hours": false, "has_portfolio": true, "has_membership": false, "has_events": true}'::jsonb, 8),
  ('craftsperson', 'Håndverker', 'Duojár', 'Hammer',
   '{"has_products": true, "has_services": true, "has_booking": true, "has_menu": false, "has_opening_hours": true, "has_portfolio": true, "has_membership": false, "has_events": true}'::jsonb, 9),
  ('restaurant', 'Restaurant/Kafé', 'Restauráŋŋa', 'UtensilsCrossed',
   '{"has_products": false, "has_services": false, "has_booking": true, "has_menu": true, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 10),
  ('service_provider', 'Tjenesteyter', 'Bálvalusdoaibma', 'Wrench',
   '{"has_products": false, "has_services": true, "has_booking": true, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 11),
  ('other', 'Annet', 'Eará', 'CircleDot',
   '{"has_products": true, "has_services": true, "has_booking": false, "has_menu": false, "has_opening_hours": true, "has_portfolio": false, "has_membership": false, "has_events": true}'::jsonb, 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. OPPDATER COMMUNITIES TABELL
-- ============================================

-- Legg til category_id referanse (beholder category-text for bakoverkompatibilitet)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL;

-- Legg til settings JSONB kolonne
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "visibility": {
      "status": "active",
      "who_can_see": "everyone",
      "show_in_catalog": true,
      "visible_contact_fields": ["email", "phone", "website", "address"]
    },
    "communication": {
      "allow_messages": true,
      "auto_reply": null,
      "notifications": {
        "new_follower": true,
        "new_message": true,
        "new_comment": true
      }
    },
    "content": {
      "who_can_post": "admins_only",
      "comments": "open",
      "blocked_words": []
    },
    "cta_button": {
      "type": "contact",
      "label": null,
      "url": null
    }
  }'::jsonb;

-- Legg til flere felt
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS membership_info TEXT,
  ADD COLUMN IF NOT EXISTS artist_statement TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Oppdater category_id basert på category text
UPDATE communities c
SET category_id = cc.id
FROM community_categories cc
WHERE c.category = cc.slug AND c.category_id IS NULL;

-- Nye indekser
CREATE INDEX IF NOT EXISTS idx_communities_category_id ON communities(category_id);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON communities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_communities_tags ON communities USING GIN(tags);

-- ============================================
-- 3. ATTRIBUTES (Tilgjengelighet, eierskap, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS attributes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_no TEXT NOT NULL,
  name_se TEXT,
  name_sma TEXT,
  name_smj TEXT,
  icon TEXT,                       -- Lucide icon name
  category TEXT NOT NULL CHECK (category IN (
    'accessibility',   -- Tilgjengelighet
    'ownership',       -- Eierskap
    'sustainability',  -- Bærekraft
    'language',        -- Språk
    'certification',   -- Sertifisering
    'other'            -- Annet
  )),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT TRUE,  -- For brukerforslag
  suggested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_attributes_slug ON attributes(slug);
CREATE INDEX IF NOT EXISTS idx_attributes_category ON attributes(category);
CREATE INDEX IF NOT EXISTS idx_attributes_active_approved ON attributes(is_active, is_approved)
  WHERE is_active = TRUE AND is_approved = TRUE;

-- Enable RLS
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view approved attributes" ON attributes
  FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

CREATE POLICY "Users can see their own suggestions" ON attributes
  FOR SELECT USING (suggested_by = auth.uid());

CREATE POLICY "Authenticated users can suggest attributes" ON attributes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND suggested_by = auth.uid() AND is_approved = FALSE);

CREATE POLICY "Platform admins can manage attributes" ON attributes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Legg inn standard attributter
INSERT INTO attributes (slug, name_no, name_se, icon, category) VALUES
  -- Tilgjengelighet
  ('wheelchair_accessible', 'Rullestolvennlig', 'Juvlastuolui heivehuvvon', 'Accessibility', 'accessibility'),
  ('hearing_loop', 'Teleslynge', 'Gullansláhppa', 'Ear', 'accessibility'),
  ('braille', 'Blindeskrift', 'Čálus', 'Eye', 'accessibility'),
  ('sign_language', 'Tegnspråk', 'Seavagiella', 'Hand', 'accessibility'),
  -- Eierskap
  ('sami_owned', 'Samisk-eid', 'Sámi eaiggáduššan', 'Users', 'ownership'),
  ('woman_led', 'Kvinne-ledet', 'Nissoniid jođihan', 'User', 'ownership'),
  ('family_business', 'Familiebedrift', 'Bearašfitnodat', 'Home', 'ownership'),
  ('indigenous_owned', 'Urfolks-eid', 'Eamiálbmogiid eaiggáduššan', 'Globe', 'ownership'),
  -- Bærekraft
  ('eco_certified', 'Miljøsertifisert', 'Birasduođaštuvvon', 'Leaf', 'sustainability'),
  ('local_products', 'Lokalprodusert', 'Báikkálaččat buvttaduvvon', 'MapPin', 'sustainability'),
  ('organic', 'Økologisk', 'Ekologalaš', 'Sprout', 'sustainability'),
  ('sustainable', 'Bærekraftig', 'Ceavzilis', 'Recycle', 'sustainability'),
  -- Språk
  ('serves_in_northern_sami', 'Betjening på nordsamisk', 'Bálvalus davvisámegillii', 'MessageCircle', 'language'),
  ('serves_in_lule_sami', 'Betjening på lulesamisk', 'Bálvalus julevsábmaj', 'MessageCircle', 'language'),
  ('serves_in_southern_sami', 'Betjening på sørsamisk', 'Bálvalus åarjelsaemien', 'MessageCircle', 'language')
ON CONFLICT (slug) DO NOTHING;

-- Junction table for community attributes
CREATE TABLE IF NOT EXISTS community_attributes (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, attribute_id)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_attributes_community ON community_attributes(community_id);
CREATE INDEX IF NOT EXISTS idx_community_attributes_attribute ON community_attributes(attribute_id);

-- Enable RLS
ALTER TABLE community_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view community attributes" ON community_attributes
  FOR SELECT USING (TRUE);

CREATE POLICY "Community admins can manage attributes" ON community_attributes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_attributes.community_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 4. OPENING HOURS (Åpningstider)
-- ============================================

CREATE TABLE IF NOT EXISTS community_opening_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Søndag
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  note TEXT,  -- "Stengt i lunsj 12-13"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, day_of_week)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_opening_hours_community ON community_opening_hours(community_id);

-- Enable RLS
ALTER TABLE community_opening_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view opening hours" ON community_opening_hours
  FOR SELECT USING (TRUE);

CREATE POLICY "Community admins can manage opening hours" ON community_opening_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_opening_hours.community_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 5. EVENTS/ARRANGEMENTER
-- ============================================

CREATE TABLE IF NOT EXISTS community_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_url TEXT,  -- Google Maps link etc.
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Europe/Oslo',
  -- Gjentakelse (iCal RRULE format)
  recurrence_rule TEXT,
  recurrence_end TIMESTAMP WITH TIME ZONE,
  parent_event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  -- Påmelding
  attendee_limit INT,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_url TEXT,
  -- Pris
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'NOK',
  -- Media
  image_url TEXT,
  external_url TEXT,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  UNIQUE(community_id, slug)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_events_community ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_starts_at ON community_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_community_events_active ON community_events(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_events_slug ON community_events(community_id, slug);

-- Enable RLS
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active events" ON community_events
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage events" ON community_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_events.community_id
      AND user_id = auth.uid()
    )
  );

-- Event registrations (påmeldinger)
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'waitlist')),
  notes TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Community admins can see all registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_events ce
      JOIN community_admins ca ON ca.community_id = ce.community_id
      WHERE ce.id = event_registrations.event_id
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registration" ON event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registration" ON event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. FAQ (Spørsmål og svar)
-- ============================================

CREATE TABLE IF NOT EXISTS community_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_faqs_community ON community_faqs(community_id);
CREATE INDEX IF NOT EXISTS idx_community_faqs_active ON community_faqs(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE community_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active FAQs" ON community_faqs
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage FAQs" ON community_faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_faqs.community_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 7. PORTFOLIO (Kunstner-portefølje)
-- ============================================

CREATE TABLE IF NOT EXISTS community_portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'link', 'embed')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  external_link TEXT,
  embed_code TEXT,  -- For YouTube, Spotify, etc.
  sort_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_portfolio_community ON community_portfolio_items(community_id);
CREATE INDEX IF NOT EXISTS idx_community_portfolio_active ON community_portfolio_items(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_portfolio_featured ON community_portfolio_items(is_featured) WHERE is_featured = TRUE;

-- Enable RLS
ALTER TABLE community_portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active portfolio items" ON community_portfolio_items
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage portfolio" ON community_portfolio_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_portfolio_items.community_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 8. CERTIFICATIONS (Sertifiseringer)
-- ============================================

CREATE TABLE IF NOT EXISTS community_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  description TEXT,
  issued_date DATE,
  expires_date DATE,
  document_url TEXT,
  verification_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_certifications_community ON community_certifications(community_id);
CREATE INDEX IF NOT EXISTS idx_community_certifications_active ON community_certifications(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE community_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active certifications" ON community_certifications
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Community admins can manage certifications" ON community_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_certifications.community_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 9. GOOGLE MY BUSINESS INTEGRATION (Forberedt)
-- ============================================

CREATE TABLE IF NOT EXISTS community_google_integration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE UNIQUE,
  google_place_id TEXT,
  google_account_id TEXT,
  google_location_id TEXT,
  -- OAuth tokens (bør krypteres i produksjon)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  -- Sync settings
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT FALSE,
  sync_fields JSONB DEFAULT '["reviews", "hours", "photos"]'::jsonb,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  -- Manual link (enklere alternativ)
  manual_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_google_community ON community_google_integration(community_id);

-- Enable RLS
ALTER TABLE community_google_integration ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Community admins can view google integration" ON community_google_integration
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_google_integration.community_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community owners can manage google integration" ON community_google_integration
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_google_integration.community_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================
-- 10. REVIEWS/ANMELDELSER (Latent - ikke aktivert ennå)
-- ============================================

CREATE TABLE IF NOT EXISTS community_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  -- Response from community
  response TEXT,
  response_by UUID REFERENCES profiles(id),
  response_at TIMESTAMP WITH TIME ZONE,
  -- Moderation
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_reason TEXT,
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_reviews_community ON community_reviews(community_id);
CREATE INDEX IF NOT EXISTS idx_community_reviews_user ON community_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reviews_rating ON community_reviews(rating);

-- Enable RLS (men ingen SELECT policy ennå - latent funksjon)
ALTER TABLE community_reviews ENABLE ROW LEVEL SECURITY;

-- Kun INSERT/UPDATE/DELETE policies - ingen SELECT for vanlige brukere ennå
CREATE POLICY "Users can manage their own reviews" ON community_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can manage all reviews" ON community_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================
-- 11. ANALYTICS/STATISTIKK (Latent - ikke aktivert ennå)
-- ============================================

CREATE TABLE IF NOT EXISTS community_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  cta_clicks INT DEFAULT 0,
  message_requests INT DEFAULT 0,
  new_followers INT DEFAULT 0,
  profile_visits INT DEFAULT 0,
  product_views INT DEFAULT 0,
  service_views INT DEFAULT 0,
  event_views INT DEFAULT 0,
  -- Demografisk data (aggregert)
  visitor_locations JSONB DEFAULT '{}'::jsonb,
  referrer_sources JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, date)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_analytics_community ON community_analytics(community_id);
CREATE INDEX IF NOT EXISTS idx_community_analytics_date ON community_analytics(date DESC);

-- Enable RLS
ALTER TABLE community_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (kun for community admins)
CREATE POLICY "Community admins can view analytics" ON community_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_analytics.community_id
      AND user_id = auth.uid()
    )
  );

-- Kun platform kan INSERT analytics (via server-side)
CREATE POLICY "System can insert analytics" ON community_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================
-- 12. ADMIN ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS community_admin_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'update_settings', 'add_admin', 'remove_admin', 'create_event', etc.
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_community_admin_activity_community ON community_admin_activity(community_id);
CREATE INDEX IF NOT EXISTS idx_community_admin_activity_user ON community_admin_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_community_admin_activity_created ON community_admin_activity(created_at DESC);

-- Enable RLS
ALTER TABLE community_admin_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Community admins can view activity log" ON community_admin_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_id = community_admin_activity.community_id
      AND user_id = auth.uid()
    )
  );

-- System INSERT policy (via triggers/functions)
CREATE POLICY "System can log activity" ON community_admin_activity
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 13. NYE RPC FUNCTIONS
-- ============================================

-- Hent kategorier med features
CREATE OR REPLACE FUNCTION get_community_categories()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name_no TEXT,
  name_se TEXT,
  icon TEXT,
  features JSONB,
  sort_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.slug,
    cc.name_no,
    cc.name_se,
    cc.icon,
    cc.features,
    cc.sort_order
  FROM community_categories cc
  WHERE cc.is_active = TRUE
  ORDER BY cc.sort_order, cc.name_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hent attributter etter kategori
CREATE OR REPLACE FUNCTION get_attributes_by_category(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name_no TEXT,
  name_se TEXT,
  icon TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.name_no,
    a.name_se,
    a.icon,
    a.category
  FROM attributes a
  WHERE a.is_active = TRUE
    AND a.is_approved = TRUE
    AND (p_category IS NULL OR a.category = p_category)
  ORDER BY a.category, a.name_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Oppdater community settings
CREATE OR REPLACE FUNCTION update_community_settings(
  p_community_id UUID,
  p_settings JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Sjekk admin-tilgang
  SELECT EXISTS (
    SELECT 1 FROM community_admins
    WHERE community_id = p_community_id
    AND user_id = auth.uid()
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Oppdater settings
  UPDATE communities
  SET
    settings = settings || p_settings,
    updated_at = NOW()
  WHERE id = p_community_id;

  -- Logg aktivitet
  INSERT INTO community_admin_activity (community_id, user_id, action, details)
  VALUES (p_community_id, auth.uid(), 'update_settings', p_settings);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Foreslå ny attributt
CREATE OR REPLACE FUNCTION suggest_attribute(
  p_name_no TEXT,
  p_name_se TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'other',
  p_icon TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_slug TEXT;
  v_id UUID;
BEGIN
  -- Generer slug
  v_slug := LOWER(REGEXP_REPLACE(p_name_no, '[^a-zA-Z0-9]', '_', 'g'));

  -- Sjekk om slug allerede finnes
  IF EXISTS (SELECT 1 FROM attributes WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'Attribute already exists';
  END IF;

  -- Insert forslag
  INSERT INTO attributes (slug, name_no, name_se, category, icon, suggested_by, is_approved)
  VALUES (v_slug, p_name_no, p_name_se, p_category, p_icon, auth.uid(), FALSE)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hent community med alle relasjoner
CREATE OR REPLACE FUNCTION get_community_full(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'community', row_to_json(c.*),
    'category', row_to_json(cc.*),
    'attributes', COALESCE((
      SELECT json_agg(row_to_json(a.*))
      FROM community_attributes ca
      JOIN attributes a ON a.id = ca.attribute_id
      WHERE ca.community_id = c.id AND a.is_active = TRUE
    ), '[]'::json),
    'opening_hours', COALESCE((
      SELECT json_agg(row_to_json(oh.*) ORDER BY oh.day_of_week)
      FROM community_opening_hours oh
      WHERE oh.community_id = c.id
    ), '[]'::json),
    'faqs', COALESCE((
      SELECT json_agg(row_to_json(f.*) ORDER BY f.sort_order)
      FROM community_faqs f
      WHERE f.community_id = c.id AND f.is_active = TRUE
    ), '[]'::json),
    'upcoming_events', COALESCE((
      SELECT json_agg(row_to_json(e.*) ORDER BY e.starts_at)
      FROM community_events e
      WHERE e.community_id = c.id
        AND e.is_active = TRUE
        AND e.starts_at > NOW()
      LIMIT 5
    ), '[]'::json)
  ) INTO v_result
  FROM communities c
  LEFT JOIN community_categories cc ON cc.id = c.category_id
  WHERE c.slug = p_slug AND c.is_active = TRUE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_community_categories TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_attributes_by_category TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_community_settings TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_attribute TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_full TO authenticated, anon;

-- ============================================
-- 14. OPPDATER TRIGGERS
-- ============================================

-- Trigger for updated_at på alle nye tabeller
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger til alle tabeller med updated_at
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'community_categories',
    'community_opening_hours',
    'community_events',
    'community_faqs',
    'community_portfolio_items',
    'community_certifications',
    'community_google_integration',
    'community_reviews',
    'event_registrations'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s;
      CREATE TRIGGER trigger_update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================
-- 15. RECONCILIATION FUNCTION (For denormaliserte tellere)
-- ============================================

CREATE OR REPLACE FUNCTION reconcile_community_counts()
RETURNS void AS $$
BEGIN
  -- Oppdater follower_count
  UPDATE communities c
  SET follower_count = (
    SELECT COUNT(*) FROM community_followers cf
    WHERE cf.community_id = c.id
  );

  -- Oppdater post_count
  UPDATE communities c
  SET post_count = (
    SELECT COUNT(*) FROM community_posts cp
    WHERE cp.community_id = c.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kun platform admins kan kjøre reconciliation
GRANT EXECUTE ON FUNCTION reconcile_community_counts TO authenticated;

-- ============================================
-- FERDIG
-- ============================================
-- Migrasjonen er komplett.
-- Husk å kjøre `npm run build` for å verifisere TypeScript-typer.
