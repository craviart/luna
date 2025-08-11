-- Fix RLS policies for screenshots feature
-- Run this if you're getting database permission errors

-- Disable RLS temporarily for testing (you can re-enable later with proper policies)
ALTER TABLE website_screenshots DISABLE ROW LEVEL SECURITY;

-- Or if you prefer to keep RLS enabled, create a permissive policy
-- ALTER TABLE website_screenshots ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all operations on website_screenshots" ON website_screenshots;
-- CREATE POLICY "Allow all operations on website_screenshots" ON website_screenshots
--   FOR ALL USING (true);
