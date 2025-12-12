-- =====================================================
-- VENNESYSTEM OG MELDINGER
-- =====================================================

-- 1. FRIENDSHIPS TABLE (Venneforespørsler og vennskap)
-- =====================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Forhindre duplikate forespørsler
  UNIQUE(requester_id, addressee_id),
  -- Forhindre selv-vennskap
  CHECK (requester_id != addressee_id)
);

-- Indekser for raskere oppslag
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 2. CONVERSATIONS TABLE (Samtaler mellom brukere)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONVERSATION_PARTICIPANTS (Hvem er med i samtalen)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);

-- 4. MESSAGES TABLE (Meldinger)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 5. ROW LEVEL SECURITY
-- =====================================================

-- Friendships RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Brukere kan se vennskap de er del av
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
  );

-- Brukere kan sende venneforespørsler
CREATE POLICY "Users can send friend requests" ON friendships
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
  );

-- Brukere kan oppdatere forespørsler de har mottatt (akseptere/avslå)
CREATE POLICY "Users can respond to friend requests" ON friendships
  FOR UPDATE USING (
    auth.uid() = addressee_id OR auth.uid() = requester_id
  );

-- Brukere kan slette sine egne vennskap
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
  );

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Conversation Participants RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own participation" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- 6. REALTIME - Aktiver for sanntidsvarsler
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- 7. HELPER FUNCTIONS
-- =====================================================

-- Funksjon for å sjekke om to brukere er venner
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = user1_id AND addressee_id = user2_id)
      OR (requester_id = user2_id AND addressee_id = user1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å få eller opprette samtale mellom to brukere
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  -- Finn eksisterende samtale
  SELECT c.id INTO conv_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp3
    WHERE cp3.conversation_id = c.id
  ) = 2
  LIMIT 1;

  -- Opprett ny samtale hvis ingen finnes
  IF conv_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, current_user_id), (conv_id, other_user_id);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å telle uleste meldinger
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE cp.user_id = user_id_param
    AND m.sender_id != user_id_param
    AND m.created_at > cp.last_read_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å telle ventende venneforespørsler
CREATE OR REPLACE FUNCTION get_pending_friend_requests_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM friendships
    WHERE addressee_id = user_id_param
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
