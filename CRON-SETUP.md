# 🕰️ Daily Automatic Analysis Setup

This guide explains how to set up and configure the daily automatic analysis feature for your Millie dashboard.

## ✨ Features

- **Daily Automatic Analysis**: URLs are analyzed every day at 8 AM UTC
- **Per-URL Control**: Enable/disable automatic analysis for each URL individually
- **Security**: Cron jobs are secured with `CRON_SECRET` environment variable
- **Monitoring**: Execution logs stored in Supabase for tracking and debugging
- **Performance Metrics**: Same Chrome DevTools data as manual analysis

## 🛠️ Setup Instructions

### 1. Database Setup

Run this SQL script in your Supabase dashboard to add the required columns:

```sql
-- Run this in Supabase SQL editor
-- File: scripts/add-auto-analysis-columns.sql

-- Add auto_analysis_enabled column to track which URLs should be analyzed automatically
ALTER TABLE urls ADD COLUMN IF NOT EXISTS auto_analysis_enabled BOOLEAN DEFAULT false;

-- Add last_auto_analysis column to track when the URL was last analyzed automatically
ALTER TABLE urls ADD COLUMN IF NOT EXISTS last_auto_analysis TIMESTAMP WITH TIME ZONE;

-- Add auto_analysis_frequency column for future enhancement (daily, weekly, etc.)
ALTER TABLE urls ADD COLUMN IF NOT EXISTS auto_analysis_frequency VARCHAR(20) DEFAULT 'daily';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_urls_auto_analysis_enabled ON urls(auto_analysis_enabled);
CREATE INDEX IF NOT EXISTS idx_urls_last_auto_analysis ON urls(last_auto_analysis);

-- Optional: Create a table to log cron job executions for monitoring
CREATE TABLE IF NOT EXISTS cron_logs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    urls_processed INTEGER DEFAULT 0,
    successful_analyses INTEGER DEFAULT 0,
    failed_analyses INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Environment Variables

Add this environment variable to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a secure random string (at least 16 characters)
   - **Environments**: Production (and Preview if needed)

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

### 3. Cron Job Configuration

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron-analyze",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Schedule explained:**
- `0 8 * * *` = Every day at 8:00 AM UTC
- You can modify this schedule using [cron expressions](https://crontab.guru/)

## 🎯 How to Use

### 1. Enable Automatic Analysis

1. Go to the **URLs** page in your dashboard
2. Find the URL you want to automatically analyze
3. Toggle the **"Daily Auto-Analysis"** switch to **ON**
4. The URL will now be analyzed every day at 8 AM UTC

### 2. Monitor Cron Jobs

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Cron Jobs**
2. You'll see the `/api/cron-analyze` job
3. Click **"View Logs"** to see execution history

**Manual Testing:**
You can manually trigger the cron job by clicking **"Run"** in the Vercel dashboard

### 3. Check Results

- Automatic analysis results appear in your **Analysis** dashboard
- Each result is tagged with execution timestamp
- Failed analyses are logged for debugging

## 📊 Features & Benefits

### ✅ **Automatic Daily Reports**
- No manual intervention required
- Consistent monitoring schedule
- Track performance trends over time

### ⚡ **Same Quality Analysis**
- Uses real Chrome DevTools Coverage API
- Mobile 4G network simulation
- Performance score based on Core Web Vitals

### 🔒 **Secure & Reliable**
- CRON_SECRET authentication
- Error handling and logging
- Respects Vercel function limits

### 🎛️ **Flexible Control**
- Enable/disable per URL
- Easy schedule modification
- Manual override available

## 🔧 Technical Details

### Cron Job Function (`/api/cron-analyze`)
- **Trigger**: Every day at 8 AM UTC
- **Duration**: Up to 5 minutes (300 seconds)
- **Memory**: 1024MB
- **Security**: Bearer token authentication
- **Delay**: 2-second delay between URL analyses

### Process Flow
1. **Authentication**: Verify `CRON_SECRET`
2. **Query**: Find URLs with `auto_analysis_enabled = true`
3. **Analysis**: Call `/api/analyze` for each URL
4. **Logging**: Store execution results in `cron_logs` table
5. **Response**: Return summary of completed analyses

### Error Handling
- Individual URL failures don't stop the batch
- All errors are logged for debugging
- Summary includes success/failure counts
- Toast notifications for UI updates

## 🚀 Monitoring & Troubleshooting

### View Cron Execution Logs
```sql
-- Query recent cron executions
SELECT * FROM cron_logs 
WHERE job_type = 'daily_analysis' 
ORDER BY executed_at DESC 
LIMIT 10;
```

### Check Auto-Analysis Status
```sql
-- See which URLs have auto-analysis enabled
SELECT name, url, auto_analysis_enabled, last_auto_analysis 
FROM urls 
WHERE auto_analysis_enabled = true;
```

### Common Issues

**Cron job not running:**
- Check `CRON_SECRET` environment variable
- Verify cron job is enabled in Vercel dashboard
- Ensure you're on a Vercel plan that supports cron jobs

**Analysis failures:**
- Check Vercel function logs
- Verify Supabase connection
- Ensure URLs are accessible

**Database errors:**
- Run the SQL setup script
- Check RLS policies (should be disabled)
- Verify column existence

## 📅 Schedule Customization

You can modify the schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron-analyze",
      "schedule": "0 6 * * *"     // 6 AM UTC
    }
  ]
}
```

**Popular schedules:**
- `0 8 * * *` - Daily at 8 AM UTC
- `0 8 * * 1` - Weekly on Monday at 8 AM UTC  
- `0 8 1 * *` - Monthly on 1st day at 8 AM UTC
- `0 */6 * * *` - Every 6 hours

After changing the schedule, redeploy to Vercel:
```bash
npm run build && npx vercel --prod
```

## 💡 Pro Tips

1. **Stagger Analysis Times**: If you have many URLs, consider different schedules to spread the load
2. **Monitor Performance**: Check the `cron_logs` table regularly for insights
3. **Test Manually**: Use the Vercel dashboard to test cron jobs before going live
4. **Set Reasonable Expectations**: Each URL takes ~30 seconds to analyze on mobile 4G
5. **Track Trends**: Use the Analysis dashboard to spot performance patterns over time

---

🎉 **You're all set!** Your URLs will now be automatically analyzed daily, giving you consistent performance insights without any manual effort.