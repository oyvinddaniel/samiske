-- =====================================================
-- PROFILE ENHANCEMENTS MIGRATION
-- Dato: 2026-01-10
-- Beskrivelse: Utvider profiles-tabell med 13 nye forbedringer
-- =====================================================

-- 1. BRUKERNAVN/HANDLE SYSTEM
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Username validering: alphanumerisk + underscore, 3-30 tegn
CREATE OR REPLACE FUNCTION validate_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN username ~ '^[a-zA-Z0-9_]{3,30}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE profiles
ADD CONSTRAINT username_format_check
CHECK (username IS NULL OR validate_username(username));

-- Reserved usernames
CREATE TABLE IF NOT EXISTS reserved_usernames (
  username TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO reserved_usernames (username, reason) VALUES
  ('admin', 'System reserved'),
  ('moderator', 'System reserved'),
  ('support', 'System reserved'),
  ('samiske', 'System reserved'),
  ('api', 'System reserved'),
  ('www', 'System reserved'),
  ('help', 'System reserved'),
  ('settings', 'System reserved'),
  ('profil', 'System reserved'),
  ('bruker', 'System reserved'),
  ('innstillinger', 'System reserved'),
  ('gruppe', 'System reserved'),
  ('grupper', 'System reserved'),
  ('samfunn', 'System reserved'),
  ('kalender', 'System reserved'),
  ('meldinger', 'System reserved'),
  ('bokmerker', 'System reserved')
ON CONFLICT DO NOTHING;

-- Trigger: Prevent reserved usernames
CREATE OR REPLACE FUNCTION check_username_not_reserved()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM reserved_usernames WHERE username = LOWER(NEW.username)) THEN
    RAISE EXCEPTION 'Username % is reserved', NEW.username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_reserved_username ON profiles;
CREATE TRIGGER prevent_reserved_username
BEFORE INSERT OR UPDATE OF username ON profiles
FOR EACH ROW EXECUTE FUNCTION check_username_not_reserved();

-- Index for username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username)
WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username))
WHERE username IS NOT NULL;

COMMENT ON COLUMN profiles.username IS 'Unique username handle, 3-30 chars, alphanumeric + underscore';
COMMENT ON COLUMN profiles.tagline IS 'Short one-line bio/tagline (max 100 chars)';


-- 2. COVER IMAGE & VISUAL ENHANCEMENTS
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_status_color TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.cover_image_url IS 'Cover/banner image URL (1200x400px recommended)';
COMMENT ON COLUMN profiles.avatar_status_color IS 'Optional status ring color (hex code)';


-- 3. SOSIALE LENKER
-- =====================================================
-- Bruker JSONB for fleksibilitet
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Validering: social_links må være array av objekter med type og url
CREATE OR REPLACE FUNCTION validate_social_links(links JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Må være array
  IF jsonb_typeof(links) != 'array' THEN
    RETURN FALSE;
  END IF;

  -- Maks 10 lenker
  IF jsonb_array_length(links) > 10 THEN
    RETURN FALSE;
  END IF;

  -- Hvert element må ha 'type' og 'url'
  RETURN NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(links) AS elem
    WHERE NOT (elem ? 'type' AND elem ? 'url')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE profiles
ADD CONSTRAINT social_links_format_check
CHECK (validate_social_links(social_links));

COMMENT ON COLUMN profiles.social_links IS 'Social media links as JSONB array: [{type: "instagram", url: "...", label: "..."}]';

-- Eksempel data struktur:
-- [
--   {"type": "instagram", "url": "https://instagram.com/username", "label": "@username"},
--   {"type": "facebook", "url": "https://facebook.com/username"},
--   {"type": "website", "url": "https://example.com", "label": "Min nettside"}
-- ]


-- 4. INTERESSER/HOBBYER
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Validering: maks 20 interesser, hver maks 50 tegn
CREATE OR REPLACE FUNCTION validate_interests(interests TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Maks 20 interesser
  IF array_length(interests, 1) > 20 THEN
    RETURN FALSE;
  END IF;

  -- Hver interesse maks 50 tegn
  RETURN NOT EXISTS (
    SELECT 1
    FROM unnest(interests) AS interest
    WHERE length(interest) > 50
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE profiles
ADD CONSTRAINT interests_validation_check
CHECK (validate_interests(interests));

-- GIN index for rask søk i interesser
CREATE INDEX IF NOT EXISTS idx_profiles_interests_gin ON profiles USING GIN (interests);

COMMENT ON COLUMN profiles.interests IS 'User interests/hobbies as text array (max 20, each max 50 chars)';


-- 5. SAMISKE ORGANISASJONER
-- =====================================================
-- Predefiner mulige organisasjoner
CREATE TABLE IF NOT EXISTS sami_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_sami TEXT,
  type TEXT NOT NULL,
  description TEXT,
  website TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO sami_organizations (name, name_sami, type, description, website, sort_order) VALUES
  ('Sametinget', 'Sámediggi', 'political', 'Det samiske folkets folkevalgte parlament', 'https://sametinget.no', 1),
  ('NSR - Norske Samers Riksforbund', 'NSR', 'political', 'Politisk organisasjon for samer i Norge', 'https://nsr.no', 2),
  ('Sámi Nisson Forum', 'Sámi Nisson Forum', 'cultural', 'Samisk kvinneorganisasjon', 'https://saminissonforum.no', 3),
  ('Sámiid Duodji', 'Sámiid Duodji', 'cultural', 'Samisk håndverksorganisasjon', 'https://duodji.no', 4),
  ('Sámi Allaskuvla', 'Sámi Allaskuvla', 'cultural', 'Samisk høgskole', 'https://samas.no', 5),
  ('Norske Reindriftssamers Landsforbund', 'NRL', 'cultural', 'Reindriftsorganisasjon', 'https://reindrift.no', 6),
  ('Samisk Kunstnerforbund', 'Sámi Dáiddačehpiid Searvi', 'cultural', 'Organisasjon for samiske kunstnere', null, 7),
  ('Noereh - Samisk Ungdomsorganisasjon', 'Noereh', 'youth', 'Samisk ungdomsorganisasjon', 'https://noereh.no', 8)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE sami_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sami organizations are viewable by everyone"
ON sami_organizations FOR SELECT USING (true);

-- Junction table: user <-> organizations
CREATE TABLE IF NOT EXISTS user_sami_organizations (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES sami_organizations(id) ON DELETE CASCADE,
  role TEXT,
  since_year INT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- Enable RLS
ALTER TABLE user_sami_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own organization memberships"
ON user_sami_organizations FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public organization memberships are viewable"
ON user_sami_organizations FOR SELECT
USING (is_public = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sami_orgs_user ON user_sami_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sami_orgs_org ON user_sami_organizations(organization_id);

COMMENT ON TABLE user_sami_organizations IS 'Junction table linking users to Sami organizations';


-- 6. PROFILGALLERI / FEATURED IMAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_featured_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

-- Enable RLS
ALTER TABLE user_featured_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own featured images"
ON user_featured_images FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Featured images are viewable by everyone"
ON user_featured_images FOR SELECT
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_images_user ON user_featured_images(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_images_media ON user_featured_images(media_id);

COMMENT ON TABLE user_featured_images IS 'User profile gallery - featured images (3-6 images)';


-- 7. METADATA & TIMESTAMPS
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS username_change_count INT DEFAULT 0;

COMMENT ON COLUMN profiles.username_changed_at IS 'Last time username was changed';
COMMENT ON COLUMN profiles.username_change_count IS 'Number of times username has been changed (for rate limiting)';

-- Trigger: Track username changes
CREATE OR REPLACE FUNCTION track_username_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username AND NEW.username IS NOT NULL THEN
    NEW.username_changed_at := NOW();
    NEW.username_change_count := COALESCE(OLD.username_change_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS username_change_tracker ON profiles;
CREATE TRIGGER username_change_tracker
BEFORE UPDATE OF username ON profiles
FOR EACH ROW EXECUTE FUNCTION track_username_change();


-- =====================================================
-- PROFILE STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW profile_stats AS
SELECT
  p.id AS user_id,

  -- Post statistics
  COUNT(DISTINCT posts.id) FILTER (WHERE posts.deleted_at IS NULL) AS total_posts,
  COUNT(DISTINCT posts.id) FILTER (WHERE posts.created_at >= NOW() - INTERVAL '30 days' AND posts.deleted_at IS NULL) AS posts_last_30_days,

  -- Comment statistics
  COUNT(DISTINCT comments.id) FILTER (WHERE comments.deleted_at IS NULL) AS total_comments,

  -- Friend statistics
  COUNT(DISTINCT CASE
    WHEN f.requester_id = p.id OR f.addressee_id = p.id THEN f.id
    ELSE NULL
  END) FILTER (WHERE f.status = 'accepted') AS friend_count,

  -- Engagement received
  COALESCE(SUM(post_stats.like_count), 0)::BIGINT AS total_likes_received,
  COALESCE(SUM(post_stats.comment_count), 0)::BIGINT AS total_comments_received,

  -- Activity metrics
  MAX(posts.created_at) AS last_post_at,
  MAX(comments.created_at) AS last_comment_at,

  -- Join date
  p.created_at AS member_since

FROM profiles p

LEFT JOIN posts ON posts.user_id = p.id AND posts.deleted_at IS NULL

LEFT JOIN comments ON comments.user_id = p.id AND comments.deleted_at IS NULL

LEFT JOIN friendships f ON (f.requester_id = p.id OR f.addressee_id = p.id) AND f.status = 'accepted'

LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT l.id)::BIGINT AS like_count,
    COUNT(DISTINCT c.id)::BIGINT AS comment_count
  FROM posts AS user_posts
  LEFT JOIN likes l ON l.post_id = user_posts.id
  LEFT JOIN comments c ON c.post_id = user_posts.id AND c.deleted_at IS NULL
  WHERE user_posts.user_id = p.id AND user_posts.deleted_at IS NULL
) AS post_stats ON true

GROUP BY p.id, p.created_at;

COMMENT ON VIEW profile_stats IS 'Aggregated user profile statistics';


-- =====================================================
-- USER TOP POSTS VIEW
-- =====================================================
CREATE OR REPLACE VIEW user_top_posts AS
WITH post_engagement AS (
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.created_at,
    COUNT(DISTINCT l.id)::BIGINT AS like_count,
    COUNT(DISTINCT c.id)::BIGINT AS comment_count,
    (COUNT(DISTINCT l.id) * 1.0 + COUNT(DISTINCT c.id) * 2.0) AS engagement_score
  FROM posts p
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.user_id, p.content, p.created_at
),
ranked_posts AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY engagement_score DESC, created_at DESC) AS rank
  FROM post_engagement
)
SELECT
  user_id,
  id AS post_id,
  content,
  created_at,
  like_count,
  comment_count,
  engagement_score,
  rank
FROM ranked_posts
WHERE rank <= 5;

COMMENT ON VIEW user_top_posts IS 'Top 5 posts per user by engagement (likes + comments)';


-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Profile covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-covers',
  'profile-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-covers
CREATE POLICY IF NOT EXISTS "Profile covers are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-covers');

CREATE POLICY IF NOT EXISTS "Users can upload their own profile cover"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own profile cover"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own profile cover"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Social links søk (hvis vi vil søke i JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN (social_links);

-- Cover image lookups
CREATE INDEX IF NOT EXISTS idx_profiles_cover_image ON profiles(id)
WHERE cover_image_url IS NOT NULL;

-- Featured images sorted
CREATE INDEX IF NOT EXISTS idx_featured_images_sorted ON user_featured_images(user_id, sort_order ASC);

-- Sami organizations lookups
CREATE INDEX IF NOT EXISTS idx_sami_orgs_type ON sami_organizations(type);
CREATE INDEX IF NOT EXISTS idx_sami_orgs_sort ON sami_organizations(sort_order);
