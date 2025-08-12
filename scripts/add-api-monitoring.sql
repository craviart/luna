-- API Monitoring Table for PageSpeed Insights Usage
-- Track API calls, quotas, and performance metrics

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_type TEXT NOT NULL DEFAULT 'pagespeed', -- Future: could track other APIs
  request_url TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'quick_test', 'monitored_url', 'cron'
  
  -- Request details
  http_status INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  error_code TEXT, -- E.g., 'QUOTA_EXCEEDED', 'TIMEOUT', 'INVALID_URL'
  
  -- API key usage
  api_key_used BOOLEAN DEFAULT false,
  
  -- PageSpeed specific metrics (when successful)
  performance_score INTEGER,
  fcp_time INTEGER,
  lcp_time INTEGER,
  speed_index INTEGER,
  total_blocking_time INTEGER,
  cumulative_layout_shift DECIMAL(5,3),
  
  -- Timing and metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vercel_function_id TEXT, -- For correlating with Vercel logs
  user_agent TEXT DEFAULT 'Luna Analytics',
  
  -- Indexing for performance
  CONSTRAINT valid_performance_score CHECK (performance_score >= 0 AND performance_score <= 100),
  CONSTRAINT valid_http_status CHECK (http_status >= 100 AND http_status < 600)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_success ON api_usage_logs(success, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_error_code ON api_usage_logs(error_code, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage_logs(api_key_used, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_request_type ON api_usage_logs(request_type, timestamp DESC);

-- View for daily API usage summary
CREATE OR REPLACE VIEW daily_api_usage AS
SELECT 
  DATE(timestamp) as usage_date,
  request_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  COUNT(*) FILTER (WHERE error_code = 'QUOTA_EXCEEDED') as quota_exceeded_count,
  COUNT(*) FILTER (WHERE error_code = 'TIMEOUT') as timeout_count,
  COUNT(*) FILTER (WHERE api_key_used = true) as authenticated_requests,
  COUNT(*) FILTER (WHERE api_key_used = false) as free_tier_requests,
  AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) as avg_response_time_ms,
  AVG(performance_score) FILTER (WHERE performance_score IS NOT NULL) as avg_performance_score
FROM api_usage_logs 
GROUP BY DATE(timestamp), request_type
ORDER BY usage_date DESC, request_type;

-- View for real-time API health
CREATE OR REPLACE VIEW api_health_status AS
SELECT 
  api_type,
  COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour') as requests_last_hour,
  COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour' AND success = true) as successful_last_hour,
  COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour' AND error_code = 'QUOTA_EXCEEDED') as quota_errors_last_hour,
  COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') as requests_last_24h,
  COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours' AND success = true) as successful_last_24h,
  AVG(response_time_ms) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour' AND response_time_ms IS NOT NULL) as avg_response_time_last_hour,
  MAX(timestamp) as last_request_time
FROM api_usage_logs 
GROUP BY api_type;

-- Grant permissions (adjust as needed for your setup)
-- Grant read access to authenticated users
-- Grant write access to service accounts

COMMENT ON TABLE api_usage_logs IS 'Tracks PageSpeed Insights API usage, quotas, and performance for monitoring and debugging';
COMMENT ON VIEW daily_api_usage IS 'Daily summary of API usage patterns and success rates';
COMMENT ON VIEW api_health_status IS 'Real-time API health and quota status monitoring';
