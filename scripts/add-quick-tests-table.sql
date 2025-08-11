-- Create quick_tests table for storing one-time test results
-- Run this in your Supabase SQL Editor

-- Create the quick_tests table
CREATE TABLE IF NOT EXISTS quick_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Analysis results
  analysis_result JSONB,
  
  -- Core Lighthouse metrics
  performance_score INTEGER,
  fcp_time INTEGER,
  lcp_time INTEGER,
  speed_index INTEGER,
  total_blocking_time INTEGER,
  cumulative_layout_shift DECIMAL(6,3),
  
  -- Coverage analysis
  unused_code_size TEXT,
  
  -- Status
  success BOOLEAN DEFAULT true
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quick_tests_created_at ON quick_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_tests_url ON quick_tests(url);
CREATE INDEX IF NOT EXISTS idx_quick_tests_performance_score ON quick_tests(performance_score);

-- Add comments to describe the table and columns
COMMENT ON TABLE quick_tests IS 'Stores results from one-time quick performance tests';
COMMENT ON COLUMN quick_tests.id IS 'Unique identifier for each quick test';
COMMENT ON COLUMN quick_tests.url IS 'The URL that was tested';
COMMENT ON COLUMN quick_tests.created_at IS 'When the test was performed';
COMMENT ON COLUMN quick_tests.analysis_result IS 'Complete JSON result from the analysis API';
COMMENT ON COLUMN quick_tests.performance_score IS 'Lighthouse performance score (0-100)';
COMMENT ON COLUMN quick_tests.fcp_time IS 'First Contentful Paint time in milliseconds';
COMMENT ON COLUMN quick_tests.lcp_time IS 'Largest Contentful Paint time in milliseconds';
COMMENT ON COLUMN quick_tests.speed_index IS 'Speed Index metric from Lighthouse (milliseconds)';
COMMENT ON COLUMN quick_tests.total_blocking_time IS 'Total Blocking Time metric from Lighthouse (milliseconds)';
COMMENT ON COLUMN quick_tests.cumulative_layout_shift IS 'Cumulative Layout Shift metric from Lighthouse (decimal value)';
COMMENT ON COLUMN quick_tests.unused_code_size IS 'Human-readable size of unused code (e.g., "1.2 MB")';
COMMENT ON COLUMN quick_tests.success IS 'Whether the analysis completed successfully';