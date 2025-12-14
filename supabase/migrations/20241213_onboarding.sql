-- Migration: Add onboarding_completed column to profiles
-- Date: 2025-12-13
-- Purpose: Track whether users have completed the onboarding flow

-- Add onboarding_completed column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users as having completed onboarding (they don't need to go through it)
UPDATE profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- For new users, the default is FALSE so they will be redirected to onboarding
