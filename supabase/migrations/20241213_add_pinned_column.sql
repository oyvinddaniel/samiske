-- Add pinned column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS posts_pinned_idx ON public.posts(pinned DESC);

-- Pin the specific post "Har dere innspill?"
UPDATE public.posts SET pinned = true WHERE title ILIKE '%Har dere innspill%';
