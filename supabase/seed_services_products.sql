-- Seed data for services and products testing
-- Run this after 20241214_services_products.sql migration
-- Note: This requires at least one community to exist

-- ============================================
-- SEED DATA: SERVICES
-- ============================================

-- Get a community ID (assumes at least one community exists)
DO $$
DECLARE
  v_community_id UUID;
  v_user_id UUID;
  v_municipality_id UUID;
BEGIN
  -- Get first community
  SELECT id INTO v_community_id FROM communities LIMIT 1;

  -- Get first user
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  -- Get first municipality
  SELECT id INTO v_municipality_id FROM municipalities LIMIT 1;

  -- Only proceed if we have required data
  IF v_community_id IS NOT NULL AND v_user_id IS NOT NULL THEN

    -- Service 1: Språkkurs
    INSERT INTO services (
      community_id, name, slug, description, category,
      images, contact_email, contact_phone, website_url,
      municipality_id, is_online, created_by, is_active, is_featured
    ) VALUES (
      v_community_id,
      'Nordsamisk språkkurs',
      'nordsamisk-spraakkurs',
      'Nybegynnerkurs i nordsamisk for voksne. Ukentlige samlinger med erfarne lærere. Både fysiske og digitale kurs tilgjengelig.',
      'education',
      '[]'::jsonb,
      'kurs@example.no',
      '+47 123 45 678',
      'https://example.no/spraakkurs',
      v_municipality_id,
      true,
      v_user_id,
      true,
      true
    );

    -- Service 2: Juridisk bistand
    INSERT INTO services (
      community_id, name, slug, description, category,
      images, contact_email, is_online, created_by, is_active
    ) VALUES (
      v_community_id,
      'Juridisk rådgivning',
      'juridisk-raadgivning',
      'Gratis juridisk rådgivning for samer. Spesialisert på urfolksrettigheter og reindrift.',
      'legal',
      '[]'::jsonb,
      'juridisk@example.no',
      true,
      v_user_id,
      true
    );

    -- Service 3: Oversettelse
    INSERT INTO services (
      community_id, name, slug, description, category,
      images, contact_email, contact_phone, is_online, created_by, is_active
    ) VALUES (
      v_community_id,
      'Samisk oversettelse',
      'samisk-oversettelse',
      'Profesjonell oversettelse mellom norsk og nordsamisk. Sertifiserte oversettere.',
      'translation',
      '[]'::jsonb,
      'oversetting@example.no',
      '+47 987 65 432',
      true,
      v_user_id,
      true
    );

    -- Service 4: Kulturarrangement
    INSERT INTO services (
      community_id, name, slug, description, category,
      images, contact_email, municipality_id, created_by, is_active
    ) VALUES (
      v_community_id,
      'Joik-workshop',
      'joik-workshop',
      'Lær tradisjonell joik med erfarne utøvere. Workshops for alle aldre.',
      'cultural',
      '[]'::jsonb,
      'kultur@example.no',
      v_municipality_id,
      v_user_id,
      true
    );

    -- Service 5: Helsehjelp
    INSERT INTO services (
      community_id, name, slug, description, category,
      images, contact_email, contact_phone, is_online, created_by, is_active
    ) VALUES (
      v_community_id,
      'Samisk helsetjeneste',
      'samisk-helsetjeneste',
      'Helsetjenester med samisk språk- og kulturkompetanse. Både fysisk og digitalt tilbud.',
      'healthcare',
      '[]'::jsonb,
      'helse@example.no',
      '+47 111 22 333',
      true,
      v_user_id,
      true
    );

    RAISE NOTICE 'Successfully seeded 5 services';

  ELSE
    RAISE NOTICE 'Skipping service seed: No community or user found';
  END IF;
END $$;

-- ============================================
-- SEED DATA: PRODUCTS
-- ============================================

DO $$
DECLARE
  v_community_id UUID;
  v_user_id UUID;
  v_municipality_id UUID;
BEGIN
  -- Get first community
  SELECT id INTO v_community_id FROM communities LIMIT 1;

  -- Get first user
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  -- Get first municipality
  SELECT id INTO v_municipality_id FROM municipalities LIMIT 1;

  -- Only proceed if we have required data
  IF v_community_id IS NOT NULL AND v_user_id IS NOT NULL THEN

    -- Product 1: Duodji/Håndverk
    INSERT INTO products (
      community_id, name, slug, description, category,
      images, primary_image, price, currency, price_type,
      in_stock, stock_quantity, municipality_id,
      ships_nationally, ships_internationally, created_by, is_active, is_featured
    ) VALUES (
      v_community_id,
      'Tradisjonell samisk kniv',
      'tradisjonell-samisk-kniv',
      'Håndlaget kniv i tradisjonell samisk stil. Laget av reinskinn og tre fra Finnmark.',
      'handicraft',
      '[]'::jsonb,
      null,
      1200.00,
      'NOK',
      'fixed',
      true,
      5,
      v_municipality_id,
      true,
      false,
      v_user_id,
      true,
      true
    );

    -- Product 2: Kunsthåndverk
    INSERT INTO products (
      community_id, name, slug, description, category,
      images, price, currency, price_type,
      in_stock, ships_nationally, ships_internationally, created_by, is_active
    ) VALUES (
      v_community_id,
      'Sølvsmykke med samiske symboler',
      'solvsmykke-samiske-symboler',
      'Unikt sølvsmykke inspirert av tradisjonelle samiske mønstre. Hver smykke er unik.',
      'jewelry',
      '[]'::jsonb,
      899.00,
      'NOK',
      'from',
      true,
      true,
      true,
      v_user_id,
      true
    );

    -- Product 3: Klær
    INSERT INTO products (
      community_id, name, slug, description, category,
      images, price, currency, price_type,
      in_stock, stock_quantity, ships_nationally, created_by, is_active
    ) VALUES (
      v_community_id,
      'Samisk lue',
      'samisk-lue',
      'Håndstrikket lue i tradisjonelle farger. Ull fra lokale gårder.',
      'clothing',
      '[]'::jsonb,
      450.00,
      'NOK',
      'fixed',
      true,
      12,
      true,
      v_user_id,
      true
    );

    -- Product 4: Bok
    INSERT INTO products (
      community_id, name, slug, description, category,
      images, price, currency, price_type,
      in_stock, purchase_url, ships_nationally, ships_internationally, created_by, is_active
    ) VALUES (
      v_community_id,
      'Samisk eventyrbok for barn',
      'samisk-eventyrbok-barn',
      'Illustrert bok med tradisjonelle samiske eventyr på både norsk og nordsamisk.',
      'books',
      '[]'::jsonb,
      299.00,
      'NOK',
      'fixed',
      true,
      'https://example.no/shop/eventyrbok',
      true,
      true,
      v_user_id,
      true
    );

    -- Product 5: Mat
    INSERT INTO products (
      community_id, name, slug, description, category,
      images, price, currency, price_type,
      in_stock, stock_quantity, contact_email, municipality_id, created_by, is_active
    ) VALUES (
      v_community_id,
      'Tørket reinskjøtt',
      'torket-reinskjott',
      'Tradisjonelt tørket reinskjøtt fra Finnmarksvidda. Økologisk og bærekraftig.',
      'food',
      '[]'::jsonb,
      null,
      'NOK',
      'contact',
      false,
      0,
      'mat@example.no',
      v_municipality_id,
      v_user_id,
      true
    );

    RAISE NOTICE 'Successfully seeded 5 products';

  ELSE
    RAISE NOTICE 'Skipping product seed: No community or user found';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count services
SELECT COUNT(*) as service_count FROM services;

-- Count products
SELECT COUNT(*) as product_count FROM products;

-- Show services
SELECT id, name, category, is_online FROM services ORDER BY created_at DESC;

-- Show products
SELECT id, name, category, price, in_stock FROM products ORDER BY created_at DESC;
