# 🌙 Luna Analytics

A modern web performance monitoring dashboard built with React, Vite, and Supabase.

## ✨ Features

- 📊 **Real-time Performance Monitoring** - Track FCP, LCP, Performance Score, Speed Index, TBT, and CLS
- 🔄 **Automated Analysis** - 3x daily automatic analysis via GitHub Actions
- 📱 **Responsive Design** - Beautiful dark/light theme with mobile support
- 🎯 **Quick Testing** - One-time analysis for any website
- 📈 **Historical Charts** - Track performance trends over time
- 🚀 **Fast & Reliable** - PageSpeed Insights API integration

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts with shadcn/ui chart components
- **Backend**: Supabase (PostgreSQL)
- **API**: Vercel Serverless Functions
- **Performance Data**: Google PageSpeed Insights API
- **Deployment**: Vercel
- **Automation**: GitHub Actions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/luna-analytics.git
   cd luna-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase and PageSpeed API keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PAGESPEED_API_KEY=your_pagespeed_api_key
```

## 📊 Automated Analysis

The application runs automatic analysis **3 times daily** using GitHub Actions:
- 🌅 **6:00 AM UTC** - Morning analysis
- 🌞 **2:00 PM UTC** - Afternoon analysis  
- 🌙 **10:00 PM UTC** - Evening analysis

## 🎯 Authentication

Simple pin-based authentication system (PIN: 1905).

## 📈 Performance Metrics

- **FCP** (First Contentful Paint) - Time to first content
- **LCP** (Largest Contentful Paint) - Time to largest content
- **Performance Score** - Overall performance rating (0-100)
- **Speed Index** - How quickly content is visually displayed
- **TBT** (Total Blocking Time) - Interactivity metric
- **CLS** (Cumulative Layout Shift) - Visual stability

## 🔗 Live Demo

[Luna Analytics](https://millie-static.vercel.app)

## 📝 License

MIT License - feel free to use for your projects!

---

Made with 💙 by Luna Analytics Team# Force deployment trigger
