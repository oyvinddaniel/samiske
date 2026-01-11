-- Utvid geography_suggestions til å støtte bildeforslag
-- Opprettet: 2025-12-21

-- Legg til nye suggestion_types for bilder
ALTER TABLE geography_suggestions DROP CONSTRAINT IF EXISTS geography_suggestions_suggestion_type_check;
ALTER TABLE geography_suggestions ADD CONSTRAINT geography_suggestions_suggestion_type_check
  CHECK (suggestion_type IN (
    'new_item',
    'edit_name',
    'edit_relationship',
    'edit_description',
    'delete_image',  -- Forslag om å slette et bilde
    'edit_image'     -- Forslag om å endre bildedetaljer (caption, alt_text)
  ));

-- Legg til media_id kolonne for å referere til spesifikke bilder
ALTER TABLE geography_suggestions ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES media(id) ON DELETE CASCADE;

-- Index for media_id
CREATE INDEX IF NOT EXISTS idx_geography_suggestions_media_id ON geography_suggestions(media_id) WHERE media_id IS NOT NULL;

-- Kommentar for klarhet
COMMENT ON COLUMN geography_suggestions.media_id IS 'For bildeforslag: ID til bildet som foreslås endret/slettet';
COMMENT ON TABLE geography_suggestions IS 'Brukerforslag for endringer i geografi-data og bilder. Admin må godkjenne.';
