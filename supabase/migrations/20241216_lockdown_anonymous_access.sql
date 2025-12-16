-- SIKKERHETSFIX: Lukker plattformen for anonyme brukere
-- Kun autentiserte brukere kan se innhold

-- =====================================================
-- 1. POSTS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "All posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

CREATE POLICY "Authenticated users can view posts"
ON posts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 2. COMMENTS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "All comments are viewable by everyone" ON comments;

CREATE POLICY "Authenticated users can view comments"
ON comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 3. LIKES - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;

CREATE POLICY "Authenticated users can view likes"
ON likes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 4. COMMENT_LIKES - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view comment_likes" ON comment_likes;

CREATE POLICY "Authenticated users can view comment_likes"
ON comment_likes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. COMMUNITY_FOLLOWERS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Anyone can see follower counts" ON community_followers;

CREATE POLICY "Authenticated users can view community followers"
ON community_followers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 6. EVENT_RSVPS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view rsvps" ON event_rsvps;

CREATE POLICY "Authenticated users can view event rsvps"
ON event_rsvps FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. COMMUNITY_POSTS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Anyone can see community posts" ON community_posts;

CREATE POLICY "Authenticated users can view community posts"
ON community_posts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. COMMUNITY_ADMINS - Krever autentisering
-- =====================================================
DROP POLICY IF EXISTS "Anyone can see community admins" ON community_admins;

CREATE POLICY "Authenticated users can view community admins"
ON community_admins FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- KOMMENTAR: Følgende forblir offentlig (tilsiktet):
-- - categories (for visning)
-- - countries, regions, municipalities, places, language_areas (geografi)
-- - industries, products, services (bedriftskatalog)
-- - app_settings (konfigurasjon)
-- - changelog_entries (endringslogg)
-- =====================================================

COMMENT ON POLICY "Authenticated users can view posts" ON posts IS 'Kun innloggede brukere kan se innlegg';
COMMENT ON POLICY "Authenticated users can view comments" ON comments IS 'Kun innloggede brukere kan se kommentarer';
COMMENT ON POLICY "Authenticated users can view likes" ON likes IS 'Kun innloggede brukere kan se likes';
