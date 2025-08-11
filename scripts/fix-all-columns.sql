-- Complete fix for all missing columns in analysis_results
-- Run this in your Supabase SQL Editor

-- Add ALL missing columns that the API sends
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS accessibility_score INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS code_efficiency_score INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS total_unused_bytes INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS coverage_data JSONB;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS script_count INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS style_count INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS html_size INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS images_total INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS images_without_alt INTEGER DEFAULT 0;

ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Check what columns exist now
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'analysis_results' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to verify all columns work
-- Uncomment the following lines to test:
-- INSERT INTO analysis_results (
--   url, status, load_time, success, title, html_size, word_count,
--   script_count, style_count, images_total, images_without_alt,
--   performance_score, code_efficiency_score, accessibility_score,
--   total_unused_bytes, coverage_data, raw_data
-- ) VALUES (
--   'https://test.com', 200, 1000, true, 'Test', 5000, 100,
--   5, 3, 10, 2, 85, 75, 90, 50000, '[]'::jsonb, '{}'::jsonb
-- );