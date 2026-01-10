-- =====================================================
-- SAMFUNN: LEGG TIL is_hidden KOLONNE
-- Midlertidig skjuling (reversibelt)
-- =====================================================

BEGIN;

-- Legg til is_hidden kolonne
ALTER TABLE communities
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Sett alle eksisterende til false (ikke skjult)
UPDATE communities SET is_hidden = false;

-- Indeks for rask filtrering
CREATE INDEX idx_communities_is_hidden ON communities(is_hidden);

-- Kommentar for fremtidig referanse
COMMENT ON COLUMN communities.is_hidden IS 'Midlertidig skjuling før offentlig lansering (reversibelt via is_hidden=false)';

COMMIT;
