-- =====================================================
-- HTML SANITIZATION FOR EMAIL TEMPLATES
-- Prevent XSS in email content
-- Date: 2024-12-15
-- =====================================================

-- 1. HTML escape function
CREATE OR REPLACE FUNCTION html_escape(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;

  RETURN replace(
    replace(
      replace(
        replace(
          replace(input_text, '&', '&amp;'),
        '<', '&lt;'),
      '>', '&gt;'),
    '"', '&quot;'),
  '''', '&#x27;');
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

COMMENT ON FUNCTION html_escape IS
  'Escapes HTML special characters to prevent XSS in email templates';

-- 2. Safely truncate text with HTML escaping
CREATE OR REPLACE FUNCTION safe_truncate(input_text TEXT, max_length INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;

  IF LENGTH(input_text) <= max_length THEN
    RETURN html_escape(input_text);
  ELSE
    RETURN html_escape(LEFT(input_text, max_length)) || '...';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

COMMENT ON FUNCTION safe_truncate IS
  'Truncates text to max_length and HTML-escapes it for safe email display';

-- 3. Update queue_comment_notifications with sanitization
CREATE OR REPLACE FUNCTION queue_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  comment_author_name TEXT;
  post_url TEXT;
  recipient RECORD;
  v_safe_title TEXT;
  v_safe_content TEXT;
  v_safe_author TEXT;
  v_notification_count INTEGER := 0;
BEGIN
  -- Get post details
  SELECT user_id, title INTO post_owner_id, post_title FROM posts WHERE id = NEW.post_id;
  SELECT full_name INTO comment_author_name FROM profiles WHERE id = NEW.user_id;

  -- Sanitize inputs (CRITICAL: Prevents XSS)
  v_safe_author := html_escape(COALESCE(comment_author_name, 'Noen'));
  v_safe_title := html_escape(post_title);
  v_safe_content := safe_truncate(NEW.content, 200);

  post_url := 'https://samiske.no/#post-' || NEW.post_id;

  -- Notify post owner (if they didn't write the comment)
  IF post_owner_id != NEW.user_id THEN
    FOR recipient IN
      SELECT p.id as user_id, p.email, p.full_name, np.email_comments
      FROM profiles p
      JOIN notification_preferences np ON np.user_id = p.id
      WHERE p.id = post_owner_id
        AND np.email_comments != 'none'
        AND p.email IS NOT NULL
    LOOP
      IF recipient.email_comments = 'instant' THEN
        -- Check rate limit
        IF check_rate_limit(recipient.user_id, 'email', 200) THEN
          BEGIN
            INSERT INTO email_queue (
              recipient_email,
              recipient_name,
              recipient_id,
              subject,
              body_html,
              body_text,
              email_type,
              reference_id
            ) VALUES (
              recipient.email,
              recipient.full_name,
              recipient.user_id,
              'Ny kommentar på ditt innlegg: ' || post_title,
              '<h2>Ny kommentar på ditt innlegg</h2>' ||
              '<p><strong>' || v_safe_author || '</strong> har kommentert på "' || v_safe_title || '":</p>' ||
              '<blockquote style="border-left:3px solid #1472E6;padding-left:10px;margin:10px 0;color:#333;">' ||
              v_safe_content ||
              '</blockquote>' ||
              '<p><a href="' || post_url || '">Se kommentaren</a></p>' ||
              '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi noen kommenterte på ditt innlegg. ' ||
              '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
              'Ny kommentar på ditt innlegg "' || post_title || '"' || E'\n\n' ||
              COALESCE(comment_author_name, 'Noen') || ' skrev:' || E'\n\n' ||
              LEFT(NEW.content, 200) || E'\n\n' ||
              'Se kommentaren: ' || post_url,
              'comment',
              NEW.id
            ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;

            v_notification_count := v_notification_count + 1;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to queue comment email: %', SQLERRM;
          END;
        END IF;
      ELSE
        -- Digest
        BEGIN
          INSERT INTO email_digest_items (user_id, item_type, post_id, comment_id)
          VALUES (recipient.user_id, 'comment_on_my_post', NEW.post_id, NEW.id)
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to add comment to digest: %', SQLERRM;
        END;
      END IF;
    END LOOP;
  END IF;

  -- Notify other commenters on same post (who also commented)
  FOR recipient IN
    SELECT DISTINCT
      p.id as user_id,
      p.email,
      p.full_name,
      np.email_comments
    FROM profiles p
    JOIN notification_preferences np ON np.user_id = p.id
    JOIN comments c ON c.user_id = p.id
    WHERE c.post_id = NEW.post_id
      AND p.id != NEW.user_id
      AND p.id != post_owner_id
      AND np.email_comments != 'none'
      AND p.email IS NOT NULL
    LIMIT 50 -- Safety limit
  LOOP
    IF recipient.email_comments = 'instant' THEN
      IF check_rate_limit(recipient.user_id, 'email', 200) THEN
        BEGIN
          INSERT INTO email_queue (
            recipient_email,
            recipient_name,
            recipient_id,
            subject,
            body_html,
            body_text,
            email_type,
            reference_id
          ) VALUES (
            recipient.email,
            recipient.full_name,
            recipient.user_id,
            'Ny kommentar i tråden: ' || post_title,
            '<h2>Ny kommentar i en tråd du følger</h2>' ||
            '<p><strong>' || v_safe_author || '</strong> har kommentert på "' || v_safe_title || '":</p>' ||
            '<blockquote style="border-left:3px solid #1472E6;padding-left:10px;margin:10px 0;color:#333;">' ||
            v_safe_content ||
            '</blockquote>' ||
            '<p><a href="' || post_url || '">Se kommentaren</a></p>' ||
            '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi du har kommentert på dette innlegget. ' ||
            '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
            'Ny kommentar i tråden "' || post_title || '"' || E'\n\n' ||
            COALESCE(comment_author_name, 'Noen') || ' skrev:' || E'\n\n' ||
            LEFT(NEW.content, 200) || E'\n\n' ||
            'Se kommentaren: ' || post_url,
            'comment',
            NEW.id
          ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;

          v_notification_count := v_notification_count + 1;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to queue comment thread email: %', SQLERRM;
        END;
      END IF;
    ELSE
      BEGIN
        INSERT INTO email_digest_items (user_id, item_type, post_id, comment_id)
        VALUES (recipient.user_id, 'comment_on_followed', NEW.post_id, NEW.id)
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Ignore duplicates
      END;
    END IF;
  END LOOP;

  RAISE NOTICE 'Queued % comment notifications', v_notification_count;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_new_comment_notify ON comments;
CREATE TRIGGER on_new_comment_notify
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION queue_comment_notifications();

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION html_escape TO authenticated;
GRANT EXECUTE ON FUNCTION safe_truncate TO authenticated;

-- 5. Test HTML escaping
DO $$
DECLARE
  test_input TEXT := '<script>alert("XSS")</script>';
  test_output TEXT;
BEGIN
  test_output := html_escape(test_input);

  IF test_output LIKE '%&lt;script%' AND test_output NOT LIKE '%<script%' THEN
    RAISE NOTICE 'HTML sanitization working correctly';
    RAISE NOTICE 'Test input: %', test_input;
    RAISE NOTICE 'Test output: %', test_output;
  ELSE
    RAISE WARNING 'HTML sanitization may not be working correctly!';
  END IF;
END $$;

-- 6. Add index for better comment query performance
CREATE INDEX IF NOT EXISTS idx_comments_post_user_created
  ON comments(post_id, user_id, created_at DESC);

COMMENT ON INDEX idx_comments_post_user_created IS
  'Improves performance of comment notification queries';
