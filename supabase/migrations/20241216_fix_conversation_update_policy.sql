-- =====================================================
-- FIX CONVERSATION_PARTICIPANTS UPDATE POLICY
-- Legger til WITH CHECK og gjør policy mer eksplisitt
-- Dato: 2024-12-16
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

-- Create new policy with both USING and WITH CHECK
CREATE POLICY "Users can update their own participation" ON conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant UPDATE permission explicitly
GRANT UPDATE (last_read_at) ON conversation_participants TO authenticated;

COMMENT ON POLICY "Users can update their own participation" ON conversation_participants IS
  'Brukere kan oppdatere sin egen deltakelse (last_read_at) i samtaler';
