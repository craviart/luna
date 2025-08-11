-- Disable Row Level Security for pin-based authentication
-- Run this in your Supabase SQL Editor

-- Disable RLS on both tables
ALTER TABLE urls DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own URLs" ON urls;
DROP POLICY IF EXISTS "Users can insert their own URLs" ON urls;
DROP POLICY IF EXISTS "Users can update their own URLs" ON urls;
DROP POLICY IF EXISTS "Users can delete their own URLs" ON urls;

DROP POLICY IF EXISTS "Users can view their own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can insert their own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can update their own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can delete their own analysis results" ON analysis_results;

-- Remove user_id columns if they exist (optional)
-- ALTER TABLE urls DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE analysis_results DROP COLUMN IF EXISTS user_id;

-- Grant public access to tables
GRANT ALL ON urls TO anon;
GRANT ALL ON analysis_results TO anon;
GRANT ALL ON urls TO authenticated;
GRANT ALL ON analysis_results TO authenticated;

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";