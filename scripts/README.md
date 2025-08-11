# 📁 Database Scripts

This directory contains SQL scripts for setting up and managing your Supabase database.

## 🚀 Setup Scripts (Run in order)

### 1. `supabase-schema.sql`
**Purpose**: Create the initial database schema  
**When to run**: First time setup  
**What it does**:
- Creates `urls` table for storing website URLs
- Creates `analysis_results` table for storing analysis data
- Sets up indexes for performance
- Adds sample data

### 2. `disable-rls.sql`  
**Purpose**: Disable Row Level Security for pin-based authentication  
**When to run**: After schema creation  
**What it does**:
- Disables RLS on both tables
- Drops user-based policies  
- Grants public access for anonymous users

### 3. `add-performance-columns.sql`
**Purpose**: Add FCP and LCP performance columns  
**When to run**: After initial setup  
**What it does**:
- Adds `fcp_time` column (First Contentful Paint)
- Adds `lcp_time` column (Largest Contentful Paint) 
- Adds `total_unused_size` column (human-readable format)

## 🧹 Maintenance Scripts

### `flush-analysis-data.sql`
**Purpose**: Clear all existing analysis data for a fresh start  
**When to run**: When you want to reset all analysis results  
**What it does**:
- Deletes all analysis results
- Optionally deletes URLs (commented out)
- Shows remaining record counts

### `fix-all-columns.sql`
**Purpose**: Add any missing columns to the analysis_results table  
**When to run**: If you encounter database save errors  
**What it does**:
- Adds all required columns with IF NOT EXISTS
- Shows final table structure
- Includes test insert (commented out)

## 📋 How to Use

1. **Go to your Supabase dashboard** → SQL Editor
2. **Copy and paste** the contents of the script you want to run
3. **Click "Run"** to execute
4. **Check the results** to confirm success

## ⚠️ Important Notes

- Always run scripts in the recommended order
- Backup your data before running maintenance scripts
- Test scripts on a development database first
- The scripts use `IF NOT EXISTS` to prevent conflicts