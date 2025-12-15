-- App settings table for runtime configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for maintenance check)
CREATE POLICY "Anyone can read app_settings"
  ON app_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app_settings"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert app_settings"
  ON app_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default maintenance setting
INSERT INTO app_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "Vi jobber med en oppdatering. Prøv igjen senere.", "enabled_at": null, "enabled_by": null}')
ON CONFLICT (key) DO NOTHING;

-- Function to get maintenance status (for easy querying)
CREATE OR REPLACE FUNCTION is_maintenance_mode()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT (value->>'enabled')::boolean FROM app_settings WHERE key = 'maintenance_mode'),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
