# 📸 Snapshots Feature Setup

## Overview
The Snapshots feature captures daily screenshots of monitored websites, allowing you to track visual changes over time alongside performance metrics.

## 🔧 Setup Instructions

### 1. Database Setup
Run the following SQL in your Supabase dashboard to create the necessary table:

```sql
-- Create website_screenshots table
CREATE TABLE IF NOT EXISTS website_screenshots (
  id SERIAL PRIMARY KEY,
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewport_width INTEGER DEFAULT 1200,
  viewport_height INTEGER DEFAULT 800,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
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
```

### 2. Supabase Storage Setup

1. Go to your Supabase dashboard → Storage
2. Create a new bucket called `website-screenshots`
3. Set the bucket to **public** (since we want to display the images)
4. Configure the bucket settings:
   - **Public bucket**: `true`
   - **File size limit**: `10 MB` (optional)
   - **Allowed MIME types**: `image/jpeg, image/png` (optional)

### 3. Environment Variables
Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Features

### ✅ Implemented
- **Manual Screenshot Capture**: Click the camera button on any URL card to capture a screenshot
- **Bulk Screenshot Capture**: Capture screenshots of all monitored URLs at once
- **Automated Daily Screenshots**: Screenshots are automatically captured alongside performance analysis (3x daily via GitHub Actions)
- **Screenshot Timeline**: View all captured screenshots for each monitored URL
- **Storage Management**: Screenshots are stored in Supabase Storage with automatic CDN delivery

### 🎯 MVP Features
- Grid view of all monitored URLs with latest screenshot previews
- Screenshot count badges
- Manual screenshot triggering
- Animated progress during bulk capture
- Responsive design

### 🔮 Future Enhancements (Not Yet Implemented)
- **Timeline View**: Detailed timeline showing screenshot evolution
- **Comparison Tools**: Side-by-side screenshot comparison
- **Change Detection**: Automatic visual diff highlighting
- **Download/Export**: Export screenshots or create time-lapse GIFs
- **Mobile Screenshots**: Capture both desktop and mobile views
- **Smart Cropping**: Focus on above-the-fold content only
- **Storage Optimization**: Automatic cleanup of old screenshots

## 📊 Usage

1. **Access**: Navigate to "Snapshots" in the sidebar
2. **View**: See all monitored URLs with their latest screenshots
3. **Capture**: Click the camera icon on individual cards or use "Capture All Screenshots"
4. **Monitor**: Screenshots are automatically captured during daily analysis runs

## 🔧 Technical Details

- **Screenshot Engine**: Puppeteer with Chrome headless
- **Image Format**: JPEG (80% quality for optimal size/quality balance)
- **Viewport**: 1200x800 desktop size
- **Storage**: Supabase Storage with public access
- **Database**: PostgreSQL with proper indexing for performance

## 🚨 Limitations

- Screenshots may fail for sites with bot detection
- Some dynamic content (ads, timestamps) may cause visual noise
- Storage costs increase with screenshot volume
- Processing time: ~3-8 seconds per screenshot

## 📈 Monitoring

Check Vercel function logs to monitor screenshot capture success/failure rates during automated runs.
