-- =====================================================
-- GRUPPE ADMIN-FUNKSJONER
-- Implementerer: slett, fjern medlemmer, overfor eierskap,
-- statistikk, velkomstmelding, varslingsinnstillinger
-- =====================================================

-- 1. VELKOMSTMELDING KOLONNE
-- =====================================================
ALTER TABLE groups ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- 2. SPORING AV VELKOMSTMELDING
-- =====================================================
CREATE TABLE IF NOT EXISTS group_welcome_seen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_welcome_seen_group ON group_welcome_seen(group_id);
CREATE INDEX IF NOT EXISTS idx_group_welcome_seen_user ON group_welcome_seen(user_id);

-- RLS for group_welcome_seen
ALTER TABLE group_welcome_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own welcome seen" ON group_welcome_seen
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own welcome seen" ON group_welcome_seen
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. GRUPPE-VARSLINGSINNSTILLINGER (per bruker per gruppe)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Varslingstyper
  notify_new_posts BOOLEAN DEFAULT true,
  notify_events BOOLEAN DEFAULT true,
  notify_comments_own_posts BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,

  -- Frekvens: instant, daily, weekly, none
  notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly', 'none')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_notification_prefs_group ON group_notification_preferences(group_id);
CREATE INDEX IF NOT EXISTS idx_group_notification_prefs_user ON group_notification_preferences(user_id);

-- RLS for group_notification_preferences
ALTER TABLE group_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group notification preferences" ON group_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own group notification preferences" ON group_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own group notification preferences" ON group_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own group notification preferences" ON group_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 4. RPC: SLETT GRUPPE
-- =====================================================
CREATE OR REPLACE FUNCTION delete_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Ikke autentisert';
  END IF;

  -- Sjekk om bruker er admin i gruppen
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_user_id
    AND role = 'admin'
    AND status = 'approved'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Kun administratorer kan slette gruppen';
  END IF;

  -- Slett gruppen (CASCADE tar seg av group_members, group_posts, group_invites, etc.)
  DELETE FROM groups WHERE id = p_group_id;

  RETURN TRUE;
END;
$$;

-- 5. RPC: FJERN GRUPPEMEDLEM
-- =====================================================
CREATE OR REPLACE FUNCTION remove_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user UUID;
  v_is_admin_or_mod BOOLEAN;
  v_target_role TEXT;
BEGIN
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Ikke autentisert';
  END IF;

  -- Kan ikke fjerne seg selv via denne funksjonen
  IF v_current_user = p_user_id THEN
    RAISE EXCEPTION 'Bruk forlat-gruppe for a forlate gruppen';
  END IF;

  -- Sjekk at den som fjerner er admin eller moderator
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_current_user
    AND role IN ('admin', 'moderator')
    AND status = 'approved'
  ) INTO v_is_admin_or_mod;

  IF NOT v_is_admin_or_mod THEN
    RAISE EXCEPTION 'Kun administratorer og moderatorer kan fjerne medlemmer';
  END IF;

  -- Sjekk rollen til personen som skal fjernes
  SELECT role INTO v_target_role FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Brukeren er ikke medlem av gruppen';
  END IF;

  -- Kan ikke fjerne admins (kun admins kan degradere andre admins forst)
  IF v_target_role = 'admin' THEN
    RAISE EXCEPTION 'Kan ikke fjerne en administrator. Endre rollen forst.';
  END IF;

  -- Moderatorer kan kun fjerne vanlige medlemmer
  IF v_target_role = 'moderator' THEN
    -- Sjekk om den som fjerner er admin
    IF NOT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = p_group_id
      AND user_id = v_current_user
      AND role = 'admin'
      AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Kun administratorer kan fjerne moderatorer';
    END IF;
  END IF;

  -- Fjern medlemmet
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  -- Oppdater member_count
  UPDATE groups SET member_count = member_count - 1 WHERE id = p_group_id;

  RETURN TRUE;
END;
$$;

-- 6. RPC: OVERFØR EIERSKAP
-- =====================================================
CREATE OR REPLACE FUNCTION transfer_group_ownership(p_group_id UUID, p_new_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user UUID;
  v_is_admin BOOLEAN;
  v_new_owner_status TEXT;
BEGIN
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Ikke autentisert';
  END IF;

  IF v_current_user = p_new_owner_id THEN
    RAISE EXCEPTION 'Du er allerede administrator';
  END IF;

  -- Sjekk at navaerende bruker er admin
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_current_user
    AND role = 'admin'
    AND status = 'approved'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Kun administratorer kan overfore eierskap';
  END IF;

  -- Sjekk at ny eier er godkjent medlem
  SELECT status INTO v_new_owner_status FROM group_members
  WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  IF v_new_owner_status IS NULL THEN
    RAISE EXCEPTION 'Brukeren er ikke medlem av gruppen';
  END IF;

  IF v_new_owner_status != 'approved' THEN
    RAISE EXCEPTION 'Brukeren ma vaere godkjent medlem for a bli administrator';
  END IF;

  -- Gjor ny eier til admin
  UPDATE group_members
  SET role = 'admin'
  WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  -- Nedgrader navaerende admin til member
  UPDATE group_members
  SET role = 'member'
  WHERE group_id = p_group_id AND user_id = v_current_user;

  RETURN TRUE;
END;
$$;

-- 7. RPC: HENT GRUPPESTATISTIKK
-- =====================================================
CREATE OR REPLACE FUNCTION get_group_statistics(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_user_id UUID;
  v_is_member BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  -- Sjekk at bruker er medlem av gruppen
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_user_id
    AND status = 'approved'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Kun medlemmer kan se statistikk';
  END IF;

  SELECT json_build_object(
    'member_count', (
      SELECT COUNT(*) FROM group_members
      WHERE group_id = p_group_id AND status = 'approved'
    ),
    'post_count', (
      SELECT COUNT(*) FROM group_posts gp
      JOIN posts p ON gp.post_id = p.id
      WHERE gp.group_id = p_group_id AND p.type = 'standard'
    ),
    'event_count', (
      SELECT COUNT(*) FROM group_posts gp
      JOIN posts p ON gp.post_id = p.id
      WHERE gp.group_id = p_group_id AND p.type = 'event'
    ),
    'members_this_week', (
      SELECT COUNT(*) FROM group_members
      WHERE group_id = p_group_id
      AND status = 'approved'
      AND joined_at > NOW() - INTERVAL '7 days'
    ),
    'posts_this_week', (
      SELECT COUNT(*) FROM group_posts gp
      JOIN posts p ON gp.post_id = p.id
      WHERE gp.group_id = p_group_id
      AND p.created_at > NOW() - INTERVAL '7 days'
    ),
    'pending_members', (
      SELECT COUNT(*) FROM group_members
      WHERE group_id = p_group_id AND status = 'pending'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 8. RPC: OPPDATER GRUPPE
-- =====================================================
CREATE OR REPLACE FUNCTION update_group(
  p_group_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_group_type TEXT DEFAULT NULL,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_new_slug TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Ikke autentisert';
  END IF;

  -- Sjekk at bruker er admin
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_user_id
    AND role = 'admin'
    AND status = 'approved'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Kun administratorer kan redigere gruppen';
  END IF;

  -- Generer ny slug hvis navn endres
  IF p_name IS NOT NULL THEN
    v_new_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(p_name, '[æ]', 'ae', 'gi'),
            '[ø]', 'o', 'gi'
          ),
          '[å]', 'a', 'gi'
        ),
        '[^a-z0-9]+', '-', 'gi'
      )
    );
    v_new_slug := trim(both '-' from v_new_slug);

    -- Sjekk at slug er unik
    IF EXISTS (SELECT 1 FROM groups WHERE slug = v_new_slug AND id != p_group_id) THEN
      -- Legg til timestamp for a gjore unik
      v_new_slug := v_new_slug || '-' || extract(epoch from now())::int;
    END IF;
  END IF;

  -- Oppdater gruppen
  UPDATE groups SET
    name = COALESCE(p_name, name),
    slug = COALESCE(v_new_slug, slug),
    description = COALESCE(p_description, description),
    image_url = COALESCE(p_image_url, image_url),
    group_type = COALESCE(p_group_type, group_type),
    welcome_message = COALESCE(p_welcome_message, welcome_message),
    updated_at = NOW()
  WHERE id = p_group_id;

  RETURN TRUE;
END;
$$;

-- 9. GRANTS
-- =====================================================
GRANT EXECUTE ON FUNCTION delete_group TO authenticated;
GRANT EXECUTE ON FUNCTION remove_group_member TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_group_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION update_group TO authenticated;
