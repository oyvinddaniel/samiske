-- =====================================================
-- FASE 4: GRUPPER
-- Implementerer åpne, lukkede og skjulte grupper
-- =====================================================

-- 1. GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Grunnleggende info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,

  -- Gruppetype: open (alle kan se og bli med), closed (alle ser, kun godkjente medlemmer), hidden (kun medlemmer vet om den)
  group_type TEXT NOT NULL DEFAULT 'open' CHECK (group_type IN ('open', 'closed', 'hidden')),

  -- Geografisk tilknytning (valgfritt)
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Statistikk (denormalisert for ytelse)
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_municipality ON groups(municipality_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- 2. GROUP_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Rolle: member, moderator, admin
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),

  -- Status for lukkede grupper: pending (venter godkjenning), approved, rejected
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- 3. GROUP_POSTS TABLE (kobling mellom posts og groups)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(group_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_post ON group_posts(post_id);

-- 4. GROUP_INVITES TABLE (for lukkede/skjulte grupper)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(group_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_invites_group ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_user ON group_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON group_invites(status);

-- 5. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- GROUPS POLICIES

-- Åpne grupper: Alle kan se
-- Lukkede grupper: Alle kan se at den finnes
-- Skjulte grupper: Kun medlemmer kan se
CREATE POLICY "Users can view open and closed groups" ON groups
  FOR SELECT USING (
    group_type IN ('open', 'closed')
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );

-- Autentiserte brukere kan opprette grupper
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Kun admins kan oppdatere grupper
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );

-- Kun admins kan slette grupper
CREATE POLICY "Group admins can delete groups" ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );

-- GROUP_MEMBERS POLICIES

-- Medlemmer kan se andre medlemmer i gruppen
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    -- Åpne grupper: alle kan se medlemmer
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.group_type = 'open'
    )
    -- Lukkede/skjulte: kun medlemmer kan se
    OR EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.status = 'approved'
    )
    -- Egen medlemskap
    OR group_members.user_id = auth.uid()
  );

-- Brukere kan bli med i åpne grupper, eller søke om medlemskap i lukkede
CREATE POLICY "Users can join or request membership" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Åpne grupper: kan bli med direkte
      EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = group_id
        AND groups.group_type = 'open'
      )
      -- Lukkede grupper: kan søke (status settes til pending)
      OR (
        EXISTS (
          SELECT 1 FROM groups
          WHERE groups.id = group_id
          AND groups.group_type = 'closed'
        )
        AND status = 'pending'
      )
      -- Skjulte grupper: må være invitert
      OR EXISTS (
        SELECT 1 FROM group_invites
        WHERE group_invites.group_id = group_id
        AND group_invites.invited_user_id = auth.uid()
        AND group_invites.status = 'accepted'
      )
    )
  );

-- Admins/moderators kan godkjenne medlemmer
CREATE POLICY "Admins can update members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.role IN ('admin', 'moderator')
      AND gm2.status = 'approved'
    )
  );

-- Brukere kan forlate grupper, admins kan fjerne medlemmer
CREATE POLICY "Users can leave, admins can remove" ON group_members
  FOR DELETE USING (
    group_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.role = 'admin'
      AND gm2.status = 'approved'
    )
  );

-- GROUP_POSTS POLICIES

-- Medlemmer kan se innlegg i gruppen
CREATE POLICY "Members can view group posts" ON group_posts
  FOR SELECT USING (
    -- Åpne grupper: alle kan se innlegg
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_posts.group_id
      AND groups.group_type = 'open'
    )
    -- Lukkede/skjulte: kun medlemmer
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );

-- Medlemmer kan legge til innlegg
CREATE POLICY "Members can add posts to group" ON group_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );

-- Innleggseier eller admins kan fjerne
CREATE POLICY "Post owner or admin can remove" ON group_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = group_posts.post_id
      AND posts.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
      AND group_members.status = 'approved'
    )
  );

-- GROUP_INVITES POLICIES

-- Inviterte kan se egne invitasjoner
CREATE POLICY "Users can view own invites" ON group_invites
  FOR SELECT USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
      AND group_members.status = 'approved'
    )
  );

-- Admins/moderators kan invitere
CREATE POLICY "Admins can invite" ON group_invites
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
      AND group_members.status = 'approved'
    )
  );

-- Inviterte kan svare på invitasjon
CREATE POLICY "Invited users can respond" ON group_invites
  FOR UPDATE USING (invited_user_id = auth.uid());

-- 6. HELPER FUNCTIONS
-- =====================================================

-- Funksjon for å opprette gruppe (setter oppretteren som admin)
CREATE OR REPLACE FUNCTION create_group(
  name_param TEXT,
  slug_param TEXT,
  description_param TEXT DEFAULT NULL,
  group_type_param TEXT DEFAULT 'open',
  municipality_id_param UUID DEFAULT NULL,
  place_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Opprett gruppen
  INSERT INTO groups (name, slug, description, group_type, municipality_id, place_id, created_by)
  VALUES (name_param, slug_param, description_param, group_type_param, municipality_id_param, place_id_param, auth.uid())
  RETURNING id INTO new_group_id;

  -- Legg til oppretteren som admin
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (new_group_id, auth.uid(), 'admin', 'approved');

  -- Oppdater member_count
  UPDATE groups SET member_count = 1 WHERE id = new_group_id;

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å bli med i gruppe
CREATE OR REPLACE FUNCTION join_group(group_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  group_type_val TEXT;
  result_status TEXT;
BEGIN
  -- Sjekk gruppetype
  SELECT group_type INTO group_type_val FROM groups WHERE id = group_id_param;

  IF group_type_val IS NULL THEN
    RETURN 'not_found';
  END IF;

  -- Sjekk om allerede medlem
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = group_id_param AND user_id = auth.uid()) THEN
    RETURN 'already_member';
  END IF;

  CASE group_type_val
    WHEN 'open' THEN
      INSERT INTO group_members (group_id, user_id, role, status)
      VALUES (group_id_param, auth.uid(), 'member', 'approved');
      UPDATE groups SET member_count = member_count + 1 WHERE id = group_id_param;
      result_status := 'joined';
    WHEN 'closed' THEN
      INSERT INTO group_members (group_id, user_id, role, status)
      VALUES (group_id_param, auth.uid(), 'member', 'pending');
      result_status := 'pending';
    WHEN 'hidden' THEN
      -- Sjekk om invitert
      IF EXISTS (SELECT 1 FROM group_invites WHERE group_id = group_id_param AND invited_user_id = auth.uid() AND status = 'accepted') THEN
        INSERT INTO group_members (group_id, user_id, role, status)
        VALUES (group_id_param, auth.uid(), 'member', 'approved');
        UPDATE groups SET member_count = member_count + 1 WHERE id = group_id_param;
        result_status := 'joined';
      ELSE
        result_status := 'invite_required';
      END IF;
  END CASE;

  RETURN result_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å godkjenne medlemskap
CREATE OR REPLACE FUNCTION approve_member(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Sjekk at den som godkjenner er admin/moderator
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_id_param
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND status = 'approved'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Godkjenn medlemskapet
  UPDATE group_members
  SET status = 'approved', approved_by = auth.uid(), approved_at = NOW()
  WHERE group_id = group_id_param AND user_id = user_id_param AND status = 'pending';

  IF FOUND THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = group_id_param;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å hente brukerens grupper
CREATE OR REPLACE FUNCTION get_user_groups(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  group_type TEXT,
  member_count INT,
  post_count INT,
  user_role TEXT,
  user_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.slug,
    g.description,
    g.image_url,
    g.group_type,
    g.member_count,
    g.post_count,
    gm.role as user_role,
    gm.status as user_status
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = COALESCE(user_id_param, auth.uid())
  AND gm.status = 'approved'
  ORDER BY g.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGERS FOR STATISTICS
-- =====================================================

-- Trigger for å oppdatere post_count
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_group_post_count
AFTER INSERT OR DELETE ON group_posts
FOR EACH ROW EXECUTE FUNCTION update_group_post_count();

-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION create_group TO authenticated;
GRANT EXECUTE ON FUNCTION join_group TO authenticated;
GRANT EXECUTE ON FUNCTION approve_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups TO anon;
