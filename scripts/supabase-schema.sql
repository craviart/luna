-- Millie Dashboard Database Schema for Supabase
-- Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- URLs table to store monitored websites
CREATE TABLE IF NOT EXISTS urls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status INTEGER,
  load_time INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  title TEXT,
  html_size INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  script_count INTEGER DEFAULT 0,
  style_count INTEGER DEFAULT 0,
  images_total INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  code_efficiency_score INTEGER DEFAULT 0,
  accessibility_score INTEGER DEFAULT 0,
  total_unused_bytes INTEGER DEFAULT 0,
  coverage_data JSONB,
  dom_content_loaded INTEGER,
  load_complete INTEGER,
  first_contentful_paint REAL,
  total_requests INTEGER,
  total_size INTEGER,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_results_url_id ON analysis_results(url_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);

-- Sample data (optional)
INSERT INTO urls (url, name, description) VALUES 
('https://example.com', 'Example Website', 'Sample website for testing')
ON CONFLICT (url) DO NOTHING;
