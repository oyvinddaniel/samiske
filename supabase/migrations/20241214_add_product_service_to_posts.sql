-- Add product and service references to posts
-- This allows communities to promote products/services as posts

-- Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_product ON posts(product_id);
CREATE INDEX IF NOT EXISTS idx_posts_service ON posts(service_id);

-- Add constraint: a post can reference either a product OR a service, not both
ALTER TABLE posts
ADD CONSTRAINT check_product_or_service
CHECK (
  (product_id IS NULL OR service_id IS NULL)
);

-- Comments
COMMENT ON COLUMN posts.product_id IS 'Reference to promoted product (mutually exclusive with service_id)';
COMMENT ON COLUMN posts.service_id IS 'Reference to promoted service (mutually exclusive with product_id)';
