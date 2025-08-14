# AI Insights Setup Guide

## Overview
Luna Analytics now includes AI-powered performance insights using Google Gemini Flash (free tier).

## Setup Instructions

### 1. Get Google Gemini API Key
1. Visit [Google AI Studio](https://ai.google.dev)
2. Sign in with your Google account
3. Click "Get API Key" → "Create API Key"
4. Copy the generated API key

### 2. Add Environment Variable
Add the API key to your Vercel environment variables:

**For Staging:**
```bash
# In Vercel Dashboard → Project → Settings → Environment Variables
GEMINI_API_KEY=your_api_key_here
```

**For Local Development:**
```bash
# Add to .env.local
GEMINI_API_KEY=your_api_key_here
```

### 3. Deploy and Test
1. Deploy to staging
2. Visit the Dashboard
3. AI insights should appear automatically above the monitored websites

## Features

### ✅ What's Included
- **Smart Analysis**: AI analyzes performance scores, FCP, LCP across all monitored sites
- **Actionable Insights**: 1-2 sentence recommendations based on your data
- **Fallback Logic**: Rule-based insights if AI service is unavailable
- **Rate Limiting**: Intelligent caching to stay within free tier limits
- **Manual Refresh**: Click refresh button to regenerate insights

### 📊 Sample Insights
- *"Your sites are performing well with an average score of 78. Homepage leads at 92/100 while the checkout page needs optimization."*
- *"Performance improved 12% this week! LCP times are trending downward across all monitored pages."*
- *"3 sites scored below 50 - consider optimizing images and reducing JavaScript for better user experience."*

## API Usage & Limits

### Google Gemini Flash Free Tier
- **Requests**: 15 per minute, 1 million per day
- **Context**: 1 million tokens per day
- **Cost**: Completely free

### Our Usage Pattern
- Generates insights only when dashboard loads or refresh is clicked
- Caches insights for 30 seconds to avoid duplicate calls
- Small prompts (~500 tokens) = thousands of insights per day possible

## Troubleshooting

### Common Issues
1. **"AI service not configured"** → API key not set in environment variables
2. **"AI service authentication failed"** → Invalid API key
3. **Fallback insights showing** → API quota exceeded or service down (rare)

### Testing
```bash
# Test API endpoint directly
curl -X POST https://your-domain.vercel.app/api/ai-insights \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt"}'
```

## Security Notes
- API key is server-side only (not exposed to frontend)
- Gemini safety settings enabled to filter inappropriate content
- No user data is stored by Google (stateless API calls)
