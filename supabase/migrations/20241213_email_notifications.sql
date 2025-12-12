-- =====================================================
-- E-POSTVARSLING SYSTEM
-- =====================================================

-- 1. TABELL FOR E-POSTKØ
-- Lagrer e-poster som skal sendes
-- =====================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('new_post', 'comment', 'daily_digest', 'weekly_digest')),
  reference_id UUID, -- Post ID eller Comment ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Forhindre duplikate e-poster for samme referanse til samme bruker
  UNIQUE(recipient_id, email_type, reference_id)
);

-- Indekser for effektiv spørring
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient_id);

-- 2. TABELL FOR DAGLIG/UKENTLIG OPPSUMMERING
-- Samler innlegg og kommentarer for digest-e-poster
-- =====================================================
CREATE TABLE IF NOT EXISTS email_digest_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('new_post', 'comment_on_my_post', 'comment_on_followed')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  included_in_digest BOOLEAN DEFAULT false,

  -- Forhindre duplikater
  UNIQUE(user_id, item_type, post_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_email_digest_user ON email_digest_items(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digest_included ON email_digest_items(included_in_digest);

-- 3. FUNKSJON: Legg til nytt innlegg i e-postkø
-- Kalles når et nytt innlegg publiseres
-- =====================================================
CREATE OR REPLACE FUNCTION queue_new_post_notifications()
RETURNS TRIGGER AS $$
DECLARE
  recipient RECORD;
  post_author_name TEXT;
  post_url TEXT;
BEGIN
  -- Hent forfatterens navn
  SELECT full_name INTO post_author_name FROM profiles WHERE id = NEW.user_id;

  -- URL til innlegget
  post_url := 'https://samiske.no/#post-' || NEW.id;

  -- For hver bruker med e-postvarsling aktivert
  FOR recipient IN
    SELECT
      p.id as user_id,
      p.email,
      p.full_name,
      np.email_new_posts
    FROM profiles p
    JOIN notification_preferences np ON np.user_id = p.id
    WHERE np.email_new_posts != 'none'
      AND p.id != NEW.user_id  -- Ikke varsle forfatteren selv
      AND p.email IS NOT NULL
  LOOP
    IF recipient.email_new_posts = 'instant' THEN
      -- Legg direkte i e-postkø for umiddelbar sending
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
        'Nytt innlegg på samiske.no: ' || NEW.title,
        '<h2>Nytt innlegg på samiske.no</h2>' ||
        '<p><strong>' || COALESCE(post_author_name, 'Noen') || '</strong> har publisert et nytt innlegg:</p>' ||
        '<h3>' || NEW.title || '</h3>' ||
        '<p>' || LEFT(NEW.content, 200) || CASE WHEN LENGTH(NEW.content) > 200 THEN '...' ELSE '' END || '</p>' ||
        '<p><a href="' || post_url || '">Les hele innlegget</a></p>' ||
        '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi du har aktivert varsler på samiske.no. ' ||
        '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
        'Nytt innlegg på samiske.no: ' || NEW.title || E'\n\n' ||
        COALESCE(post_author_name, 'Noen') || ' har publisert et nytt innlegg:' || E'\n\n' ||
        NEW.title || E'\n\n' ||
        LEFT(NEW.content, 200) || E'\n\n' ||
        'Les mer: ' || post_url,
        'new_post',
        NEW.id
      ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;

    ELSE
      -- Legg i digest-tabell for daglig/ukentlig oppsummering
      INSERT INTO email_digest_items (
        user_id,
        item_type,
        post_id
      ) VALUES (
        recipient.user_id,
        'new_post',
        NEW.id
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNKSJON: Legg til kommentar-varsler
-- Kalles når en ny kommentar legges til
-- =====================================================
CREATE OR REPLACE FUNCTION queue_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  comment_author_name TEXT;
  post_url TEXT;
  recipient RECORD;
BEGIN
  -- Hent post-info
  SELECT user_id, title INTO post_owner_id, post_title
  FROM posts WHERE id = NEW.post_id;

  -- Hent kommentarforfatterens navn
  SELECT full_name INTO comment_author_name FROM profiles WHERE id = NEW.user_id;

  -- URL til innlegget
  post_url := 'https://samiske.no/#post-' || NEW.post_id;

  -- 1. Varsle post-eieren (hvis ikke de selv kommenterte)
  IF post_owner_id != NEW.user_id THEN
    FOR recipient IN
      SELECT
        p.id as user_id,
        p.email,
        p.full_name,
        np.email_comments
      FROM profiles p
      JOIN notification_preferences np ON np.user_id = p.id
      WHERE p.id = post_owner_id
        AND np.email_comments != 'none'
        AND p.email IS NOT NULL
    LOOP
      IF recipient.email_comments = 'instant' THEN
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
          '<p><strong>' || COALESCE(comment_author_name, 'Noen') || '</strong> har kommentert på "' || post_title || '":</p>' ||
          '<blockquote style="border-left:3px solid #1472E6;padding-left:10px;color:#333;">' || NEW.content || '</blockquote>' ||
          '<p><a href="' || post_url || '">Se kommentaren</a></p>' ||
          '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi noen kommenterte på ditt innlegg. ' ||
          '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
          'Ny kommentar på ditt innlegg "' || post_title || '"' || E'\n\n' ||
          COALESCE(comment_author_name, 'Noen') || ' skrev:' || E'\n\n' ||
          NEW.content || E'\n\n' ||
          'Se kommentaren: ' || post_url,
          'comment',
          NEW.id
        ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;
      ELSE
        INSERT INTO email_digest_items (
          user_id,
          item_type,
          post_id,
          comment_id
        ) VALUES (
          recipient.user_id,
          'comment_on_my_post',
          NEW.post_id,
          NEW.id
        ) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 2. Varsle andre som har kommentert på samme innlegg
  FOR recipient IN
    SELECT DISTINCT
      p.id as user_id,
      p.email,
      p.full_name,
      np.email_comments
    FROM comments c
    JOIN profiles p ON p.id = c.user_id
    JOIN notification_preferences np ON np.user_id = p.id
    WHERE c.post_id = NEW.post_id
      AND c.user_id != NEW.user_id  -- Ikke varsle kommentarforfatteren
      AND c.user_id != post_owner_id  -- Post-eieren varsles separat
      AND np.email_comments != 'none'
      AND p.email IS NOT NULL
  LOOP
    IF recipient.email_comments = 'instant' THEN
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
        '<p><strong>' || COALESCE(comment_author_name, 'Noen') || '</strong> har også kommentert på "' || post_title || '":</p>' ||
        '<blockquote style="border-left:3px solid #1472E6;padding-left:10px;color:#333;">' || NEW.content || '</blockquote>' ||
        '<p><a href="' || post_url || '">Se kommentaren</a></p>' ||
        '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi du har kommentert på dette innlegget. ' ||
        '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
        'Ny kommentar i tråden "' || post_title || '"' || E'\n\n' ||
        COALESCE(comment_author_name, 'Noen') || ' skrev:' || E'\n\n' ||
        NEW.content || E'\n\n' ||
        'Se kommentaren: ' || post_url,
        'comment',
        NEW.id
      ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;
    ELSE
      INSERT INTO email_digest_items (
        user_id,
        item_type,
        post_id,
        comment_id
      ) VALUES (
        recipient.user_id,
        'comment_on_followed',
        NEW.post_id,
        NEW.id
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNKSJON: Generer daglig digest
-- Kalles av en cron-job (f.eks. hver dag kl. 08:00)
-- =====================================================
CREATE OR REPLACE FUNCTION generate_daily_digest()
RETURNS INTEGER AS $$
DECLARE
  recipient RECORD;
  digest_items RECORD;
  email_body_html TEXT;
  email_body_text TEXT;
  item_count INTEGER;
  emails_queued INTEGER := 0;
BEGIN
  -- For hver bruker med daglig digest aktivert
  FOR recipient IN
    SELECT
      p.id as user_id,
      p.email,
      p.full_name,
      np.email_new_posts,
      np.email_comments
    FROM profiles p
    JOIN notification_preferences np ON np.user_id = p.id
    WHERE (np.email_new_posts = 'daily' OR np.email_comments = 'daily')
      AND p.email IS NOT NULL
  LOOP
    -- Sjekk om det er noe å sende
    SELECT COUNT(*) INTO item_count
    FROM email_digest_items
    WHERE user_id = recipient.user_id
      AND included_in_digest = false
      AND created_at >= NOW() - INTERVAL '24 hours';

    IF item_count > 0 THEN
      -- Bygg e-post innhold
      email_body_html := '<h2>Din daglige oppsummering fra samiske.no</h2>';
      email_body_text := 'Din daglige oppsummering fra samiske.no' || E'\n\n';

      -- Nye innlegg
      email_body_html := email_body_html || '<h3>Nye innlegg</h3><ul>';
      FOR digest_items IN
        SELECT DISTINCT p.id, p.title, pr.full_name as author_name
        FROM email_digest_items edi
        JOIN posts p ON p.id = edi.post_id
        JOIN profiles pr ON pr.id = p.user_id
        WHERE edi.user_id = recipient.user_id
          AND edi.item_type = 'new_post'
          AND edi.included_in_digest = false
          AND edi.created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 10
      LOOP
        email_body_html := email_body_html || '<li><a href="https://samiske.no/#post-' || digest_items.id || '">' ||
                          digest_items.title || '</a> av ' || COALESCE(digest_items.author_name, 'Ukjent') || '</li>';
        email_body_text := email_body_text || '- ' || digest_items.title || ' av ' ||
                          COALESCE(digest_items.author_name, 'Ukjent') || E'\n';
      END LOOP;
      email_body_html := email_body_html || '</ul>';

      -- Nye kommentarer
      email_body_html := email_body_html || '<h3>Nye kommentarer</h3><ul>';
      FOR digest_items IN
        SELECT DISTINCT p.id, p.title, c.content as comment_content, pr.full_name as commenter_name
        FROM email_digest_items edi
        JOIN posts p ON p.id = edi.post_id
        JOIN comments c ON c.id = edi.comment_id
        JOIN profiles pr ON pr.id = c.user_id
        WHERE edi.user_id = recipient.user_id
          AND edi.item_type IN ('comment_on_my_post', 'comment_on_followed')
          AND edi.included_in_digest = false
          AND edi.created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 10
      LOOP
        email_body_html := email_body_html || '<li><strong>' || COALESCE(digest_items.commenter_name, 'Noen') ||
                          '</strong> kommenterte på <a href="https://samiske.no/#post-' || digest_items.id || '">' ||
                          digest_items.title || '</a>: "' || LEFT(digest_items.comment_content, 50) || '..."</li>';
      END LOOP;
      email_body_html := email_body_html || '</ul>';

      -- Footer
      email_body_html := email_body_html ||
        '<hr><p style="font-size:12px;color:#666;">Du mottar denne oppsummeringen daglig. ' ||
        '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>';

      -- Legg i e-postkø
      INSERT INTO email_queue (
        recipient_email,
        recipient_name,
        recipient_id,
        subject,
        body_html,
        body_text,
        email_type
      ) VALUES (
        recipient.email,
        recipient.full_name,
        recipient.user_id,
        'Daglig oppsummering fra samiske.no (' || item_count || ' nye)',
        email_body_html,
        email_body_text,
        'daily_digest'
      );

      -- Marker items som inkludert
      UPDATE email_digest_items
      SET included_in_digest = true
      WHERE user_id = recipient.user_id
        AND included_in_digest = false
        AND created_at >= NOW() - INTERVAL '24 hours';

      emails_queued := emails_queued + 1;
    END IF;
  END LOOP;

  RETURN emails_queued;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNKSJON: Generer ukentlig digest
-- Kalles av en cron-job (f.eks. hver mandag kl. 08:00)
-- =====================================================
CREATE OR REPLACE FUNCTION generate_weekly_digest()
RETURNS INTEGER AS $$
DECLARE
  recipient RECORD;
  email_body_html TEXT;
  email_body_text TEXT;
  item_count INTEGER;
  emails_queued INTEGER := 0;
  digest_items RECORD;
BEGIN
  FOR recipient IN
    SELECT
      p.id as user_id,
      p.email,
      p.full_name
    FROM profiles p
    JOIN notification_preferences np ON np.user_id = p.id
    WHERE np.email_new_posts = 'weekly'
      AND p.email IS NOT NULL
  LOOP
    -- Tell innlegg siste uke
    SELECT COUNT(*) INTO item_count
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '7 days';

    IF item_count > 0 THEN
      email_body_html := '<h2>Ukentlig oppsummering fra samiske.no</h2>' ||
                        '<p>Her er de siste innleggene fra denne uken:</p><ul>';
      email_body_text := 'Ukentlig oppsummering fra samiske.no' || E'\n\n';

      FOR digest_items IN
        SELECT p.id, p.title, p.created_at, pr.full_name as author_name
        FROM posts p
        JOIN profiles pr ON pr.id = p.user_id
        WHERE p.created_at >= NOW() - INTERVAL '7 days'
        ORDER BY p.created_at DESC
        LIMIT 15
      LOOP
        email_body_html := email_body_html || '<li><a href="https://samiske.no/#post-' || digest_items.id || '">' ||
                          digest_items.title || '</a> av ' || COALESCE(digest_items.author_name, 'Ukjent') || '</li>';
        email_body_text := email_body_text || '- ' || digest_items.title || E'\n';
      END LOOP;

      email_body_html := email_body_html || '</ul>' ||
        '<hr><p style="font-size:12px;color:#666;">Du mottar denne oppsummeringen ukentlig. ' ||
        '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>';

      INSERT INTO email_queue (
        recipient_email,
        recipient_name,
        recipient_id,
        subject,
        body_html,
        body_text,
        email_type
      ) VALUES (
        recipient.email,
        recipient.full_name,
        recipient.user_id,
        'Ukentlig oppsummering fra samiske.no (' || item_count || ' innlegg)',
        email_body_html,
        email_body_text,
        'weekly_digest'
      );

      emails_queued := emails_queued + 1;
    END IF;
  END LOOP;

  RETURN emails_queued;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGERS - Aktiver automatiske varsler
-- =====================================================
DROP TRIGGER IF EXISTS on_new_post_notify ON posts;
CREATE TRIGGER on_new_post_notify
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION queue_new_post_notifications();

DROP TRIGGER IF EXISTS on_new_comment_notify ON comments;
CREATE TRIGGER on_new_comment_notify
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION queue_comment_notifications();

-- 8. VIEW: Se ventende e-poster (for admin)
-- =====================================================
CREATE OR REPLACE VIEW pending_emails AS
SELECT
  eq.id,
  eq.recipient_email,
  eq.recipient_name,
  eq.subject,
  eq.email_type,
  eq.status,
  eq.created_at
FROM email_queue eq
WHERE eq.status = 'pending'
ORDER BY eq.created_at ASC;

-- 9. FUNKSJON: Marker e-post som sendt
-- Kalles fra Edge Function etter sending
-- =====================================================
CREATE OR REPLACE FUNCTION mark_email_sent(email_id UUID, success BOOLEAN, error_msg TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE email_queue
  SET
    status = CASE WHEN success THEN 'sent' ELSE 'failed' END,
    sent_at = CASE WHEN success THEN NOW() ELSE NULL END,
    error_message = error_msg
  WHERE id = email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. OPPRYDDING: Slett gamle e-poster etter 30 dager
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_emails()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_queue
  WHERE (status = 'sent' AND sent_at < NOW() - INTERVAL '30 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '7 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM email_digest_items
  WHERE included_in_digest = true
    AND created_at < NOW() - INTERVAL '30 days';

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Gi nødvendige tillatelser
-- =====================================================
-- E-postkø skal bare være tilgjengelig for systemet (service_role)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_digest_items ENABLE ROW LEVEL SECURITY;

-- Ingen bruker-tilgang til disse tabellene (kun service_role via Edge Functions)
