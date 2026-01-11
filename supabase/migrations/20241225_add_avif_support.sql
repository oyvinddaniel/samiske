-- Add AVIF support to media_allowed_types
-- Created: 2025-12-25
-- Purpose: Enable AVIF image format support

-- Update media_allowed_types setting to include AVIF
UPDATE app_settings
SET value = '["image/jpeg","image/png","image/webp","image/gif","image/avif"]'
WHERE key = 'media_allowed_types';

-- If the setting doesn't exist, create it
INSERT INTO app_settings (key, value, description)
VALUES (
  'media_allowed_types',
  '["image/jpeg","image/png","image/webp","image/gif","image/avif"]',
  'Allowed MIME types for image uploads'
)
ON CONFLICT (key) DO UPDATE
SET value = '["image/jpeg","image/png","image/webp","image/gif","image/avif"]';
