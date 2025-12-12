-- Add event_end_time column to posts for event duration
-- Run this in Supabase SQL Editor

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS event_end_time TIME;
