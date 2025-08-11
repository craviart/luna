-- Create website_screenshots table
CREATE TABLE IF NOT EXISTS website_screenshots (
  id SERIAL PRIMARY KEY,
  url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewport_width INTEGER DEFAULT 1200,
  viewport_height INTEGER DEFAULT 800,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_website_screenshots_url_id ON website_screenshots(url_id);
CREATE INDEX IF NOT EXISTS idx_website_screenshots_captured_at ON website_screenshots(captured_at);

-- Add RLS policy (if RLS is enabled)
ALTER TABLE website_screenshots ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on website_screenshots" ON website_screenshots
  FOR ALL USING (true);

-- Add screenshot_enabled column to urls table if it doesn't exist
ALTER TABLE urls ADD COLUMN IF NOT EXISTS screenshot_enabled BOOLEAN DEFAULT true;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS last_screenshot_at TIMESTAMP WITH TIME ZONE;
