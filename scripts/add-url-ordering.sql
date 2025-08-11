-- Add ordering functionality to URLs table
-- This allows users to drag and drop reorder their monitored pages

-- Add order column to urls table
ALTER TABLE urls 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial order values based on creation time (oldest first)
UPDATE urls 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
  FROM urls
) AS subquery
WHERE urls.id = subquery.id;

-- Add index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_urls_display_order ON urls(display_order);

-- Verify the update
SELECT id, name, url, display_order, created_at 
FROM urls 
ORDER BY display_order ASC;

-- Summary
SELECT 
  'URL ordering setup completed!' as status,
  'display_order column added to urls table' as column_added,
  'Initial order set based on creation time' as initial_order,
  'Index created for performance' as performance,
  'Ready for drag and drop reordering' as functionality;