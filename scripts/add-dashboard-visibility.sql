-- Add show_on_dashboard column to urls table
-- This column determines if a URL should appear in the dashboard's "Monitored Websites" section

ALTER TABLE urls ADD COLUMN IF NOT EXISTS show_on_dashboard BOOLEAN DEFAULT true;

-- Update existing records to show on dashboard by default
UPDATE urls SET show_on_dashboard = true WHERE show_on_dashboard IS NULL;

-- Add index for better query performance when filtering dashboard URLs
CREATE INDEX IF NOT EXISTS idx_urls_show_on_dashboard ON urls(show_on_dashboard);

-- Verification
SELECT 
    id, 
    name, 
    url, 
    show_on_dashboard,
    created_at 
FROM urls 
ORDER BY created_at DESC;

-- Confirmation message
SELECT 'Dashboard visibility column added successfully. All existing URLs set to show on dashboard.' AS status;