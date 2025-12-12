-- =====================================================
-- VARSLINGSPREFERANSER FOR E-POST, SMS OG PUSH
-- =====================================================

-- Tabell for brukerens varslingsinnstillinger
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- E-postvarsling for nye innlegg
  email_new_posts TEXT DEFAULT 'none' CHECK (email_new_posts IN ('none', 'instant', 'daily', 'weekly')),

  -- E-postvarsling for kommentarer
  email_comments TEXT DEFAULT 'daily' CHECK (email_comments IN ('none', 'instant', 'daily')),

  -- Push-varsling i nettleser
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,

  -- SMS-varsling (telefonnummer lagres i profiles)
  sms_enabled BOOLEAN DEFAULT false,
  sms_new_posts BOOLEAN DEFAULT false,
  sms_comments BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Indeks for bruker-oppslag
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun se og oppdatere sine egne preferanser
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Tabell for varslingslogg (for å unngå duplikater og spore sendinger)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push', 'sms')),
  event_type TEXT NOT NULL CHECK (event_type IN ('new_post', 'comment', 'like', 'friend_request')),
  reference_id UUID, -- Post ID, comment ID, etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Indekser for effektiv spørring
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent ON notification_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

-- RLS for notification_log (kun systemtilgang, ikke bruker)
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Funksjon for å opprette standard preferanser for nye brukere
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatisk opprettelse av preferanser ved ny bruker
DROP TRIGGER IF EXISTS on_profile_created_notification_prefs ON profiles;
CREATE TRIGGER on_profile_created_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Opprett preferanser for eksisterende brukere
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;
