-- =====================================================
-- FIX REPLICA IDENTITY FOR DELETE EVENTS
-- Gjør at Realtime DELETE events inneholder full rad-data
-- Dato: 2024-12-16
-- =====================================================

-- Sett REPLICA IDENTITY FULL på notifications-tabellen
-- Dette gjør at DELETE events i Realtime inkluderer alle kolonner,
-- ikke bare primary key. Nødvendig for å kunne filtrere DELETE events
-- på recipient_id i frontend.
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Verifiser at det er satt riktig
COMMENT ON TABLE notifications IS
  'Notifikasjoner med individuell lesestatus. REPLICA IDENTITY FULL for DELETE events i Realtime.';
