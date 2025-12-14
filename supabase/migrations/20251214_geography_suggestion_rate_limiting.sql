-- =====================================================
-- RATE LIMITING FOR GEOGRAPHY SUGGESTIONS
-- Prevent spam and abuse of suggestion system
-- Date: 2025-12-14
-- Limits: 30 per minute, 1000 per hour
-- =====================================================

-- 1. Create rate limit check function for geography suggestions
-- This function checks BOTH per-minute and per-hour limits
CREATE OR REPLACE FUNCTION check_geography_suggestion_rate_limit(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_count_minute INTEGER;
  v_count_hour INTEGER;
  v_current_minute TIMESTAMPTZ;
  v_current_hour TIMESTAMPTZ;
  v_max_per_minute INTEGER := 30;
  v_max_per_hour INTEGER := 1000;
BEGIN
  v_current_minute := date_trunc('minute', NOW());
  v_current_hour := date_trunc('hour', NOW());

  -- Check per-minute limit
  SELECT COUNT(*) INTO v_count_minute
  FROM geography_suggestions
  WHERE user_id = p_user_id
    AND created_at >= v_current_minute;

  IF v_count_minute >= v_max_per_minute THEN
    RAISE EXCEPTION 'Du har sendt for mange forslag i minuttet. Grense: % per minutt. Vennligst vent litt.', v_max_per_minute;
  END IF;

  -- Check per-hour limit
  SELECT COUNT(*) INTO v_count_hour
  FROM geography_suggestions
  WHERE user_id = p_user_id
    AND created_at >= v_current_hour;

  IF v_count_hour >= v_max_per_hour THEN
    RAISE EXCEPTION 'Du har sendt for mange forslag i timen. Grense: % per time. Prøv igjen om en time.', v_max_per_hour;
  END IF;

  -- Both limits OK
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_geography_suggestion_rate_limit IS
  'Checks if user is within rate limits for geography suggestions (30/min, 1000/hr). Raises exception if limit exceeded.';

-- 2. Create trigger function to enforce rate limit
CREATE OR REPLACE FUNCTION enforce_geography_suggestion_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check rate limit before allowing insert
  IF NOT check_geography_suggestion_rate_limit(NEW.user_id) THEN
    -- This line won't be reached because the function raises exception
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add trigger to geography_suggestions table
DROP TRIGGER IF EXISTS geography_suggestions_rate_limit ON geography_suggestions;

CREATE TRIGGER geography_suggestions_rate_limit
  BEFORE INSERT ON geography_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_geography_suggestion_rate_limit();

COMMENT ON TRIGGER geography_suggestions_rate_limit ON geography_suggestions IS
  'Enforces rate limiting on geography suggestion submissions';

-- 4. Create monitoring view for admins
CREATE OR REPLACE VIEW geography_suggestion_rate_stats AS
SELECT
  gs.user_id,
  COUNT(*) as suggestion_count,
  date_trunc('hour', gs.created_at) as hour_window,
  p.full_name,
  p.email
FROM geography_suggestions gs
JOIN profiles p ON p.id = gs.user_id
WHERE gs.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY gs.user_id, date_trunc('hour', gs.created_at), p.full_name, p.email
HAVING COUNT(*) > 10  -- Show users with more than 10 suggestions per hour
ORDER BY suggestion_count DESC, hour_window DESC;

COMMENT ON VIEW geography_suggestion_rate_stats IS
  'Shows geography suggestion activity for the last 24 hours, highlighting high-volume submitters';

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION check_geography_suggestion_rate_limit TO authenticated;
GRANT SELECT ON geography_suggestion_rate_stats TO authenticated;

-- 6. Verification test
DO $$
DECLARE
  test_result BOOLEAN;
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
BEGIN
  -- Test rate limit function (should return TRUE for test user with no submissions)
  test_result := check_geography_suggestion_rate_limit(test_user_id);

  IF test_result THEN
    RAISE NOTICE 'Geography suggestion rate limiting initialized successfully';
    RAISE NOTICE 'Limits: 30 per minute, 1000 per hour';
  ELSE
    RAISE WARNING 'Rate limiting test failed';
  END IF;
END $$;
