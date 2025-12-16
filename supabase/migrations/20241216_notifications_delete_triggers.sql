-- =====================================================
-- NOTIFICATIONS DELETE TRIGGERS
-- Fjern notifikasjoner når likes/comments slettes
-- Dato: 2024-12-16
-- =====================================================

-- 1. DELETE trigger for likes
-- =====================================================
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Slett notifikasjon når like fjernes
  DELETE FROM notifications
  WHERE like_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_like_notification
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION delete_like_notification();

-- 2. DELETE trigger for comments
-- =====================================================
CREATE OR REPLACE FUNCTION delete_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Slett notifikasjon når kommentar fjernes
  DELETE FROM notifications
  WHERE comment_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_comment_notification
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION delete_comment_notification();

-- 3. COMMENTS
-- =====================================================
COMMENT ON FUNCTION delete_like_notification IS
  'Sletter tilhørende notifikasjon når en like fjernes (unlike)';

COMMENT ON FUNCTION delete_comment_notification IS
  'Sletter tilhørende notifikasjon når en kommentar slettes';
