// Automatic analysis cron job
// This function runs daily (9am UTC) and analyzes all monitored URLs

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Debug: Log request details
  console.log('🔍 Cron request debug:')
  console.log('- Method:', req.method)
  console.log('- User-Agent:', req.headers['user-agent'] || 'undefined')
  console.log('- Authorization:', req.headers['authorization'] || 'undefined')
  console.log('- All headers:', Object.keys(req.headers))
  
  // Security: Verify this is a legitimate automated request (Vercel cron OR GitHub Actions)
  const userAgent = req.headers['user-agent'] || ''
  const isVercelCron = userAgent === 'vercel-cron/1.0'
  const isGitHubActions = userAgent.includes('GitHub-Actions-Luna-Analytics')
  
  if (!isVercelCron && !isGitHubActions) {
    console.log('❌ Unauthorized: Not from authorized automation')
    console.log('- Expected User-Agent: vercel-cron/1.0 OR GitHub-Actions-Luna-Analytics/*')
    console.log('- Received User-Agent:', userAgent)
    return res.status(401).json({ 
      error: 'Unauthorized - Invalid user agent',
      expected: ['vercel-cron/1.0', 'GitHub-Actions-Luna-Analytics/*'],
      received: userAgent
    })
  }
  
  const source = isVercelCron ? 'Vercel Cron' : 'GitHub Actions'
  console.log(`✅ Verified automated request from: ${source}`)

  console.log('Automatic cron job started at:', new Date().toISOString())

  try {
    // Get all monitored URLs for automatic analysis
    const { data: urlsToAnalyze, error: urlsError } = await supabase
      .from('urls')
      .select('*')

    if (urlsError) {
      console.error('Error fetching URLs:', urlsError)
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch URLs for analysis',
        details: urlsError 
      })
    }

    if (!urlsToAnalyze || urlsToAnalyze.length === 0) {
      console.log('No monitored URLs found')
      return res.status(200).json({ 
        success: true, 
        message: 'No monitored URLs found for automatic analysis',
        analyzed_count: 0
      })
    }

    console.log(`Found ${urlsToAnalyze.length} monitored URLs for automatic analysis`)
    
    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each URL (with some delay to avoid overwhelming the server)
    for (const url of urlsToAnalyze) {
      try {
        console.log(`Starting analysis for: ${url.url}`)
        
        // Call our PageSpeed-only analyze API
        const analysisResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : `https://${req.headers.host}`}/api/analyze-pagespeed-only`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url.url,
            urlId: url.id,
            isQuickTest: false
          })
        })

        const analysisResult = await analysisResponse.json()
        
        if (analysisResult.success) {
          console.log(`✅ Successfully analyzed: ${url.url}`)
          successCount++
          
          // Also capture screenshot if analysis was successful
          try {
            console.log(`📸 Capturing screenshot for: ${url.url}`)
            const screenshotResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : `https://${req.headers.host}`}/api/capture-screenshot`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: url.url,
                urlId: url.id
              })
            })

            const screenshotResult = await screenshotResponse.json()
            if (screenshotResult.success) {
              console.log(`📷 Screenshot captured for: ${url.url}`)
              results.push({
                url_id: url.id,
                url: url.url,
                status: 'success',
                message: 'Analysis and screenshot completed successfully'
              })
            } else {
              console.log(`⚠️ Screenshot failed for ${url.url}, but analysis succeeded`)
              results.push({
                url_id: url.id,
                url: url.url,
                status: 'success',
                message: 'Analysis completed successfully (screenshot failed)'
              })
            }
          } catch (screenshotError) {
            console.log(`⚠️ Screenshot error for ${url.url}:`, screenshotError.message)
            results.push({
              url_id: url.id,
              url: url.url,
              status: 'success',
              message: 'Analysis completed successfully (screenshot failed)'
            })
          }
        } else {
          console.error(`❌ Failed to analyze: ${url.url}`, analysisResult.message)
          errorCount++
          results.push({
            url_id: url.id,
            url: url.url,
            status: 'error',
            message: analysisResult.message || 'Analysis failed'
          })
        }

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`❌ Error analyzing ${url.url}:`, error.message)
        errorCount++
        results.push({
          url_id: url.id,
          url: url.url,
          status: 'error',
          message: error.message
        })
      }
    }

    // Log summary to Vercel logs for monitoring
    console.log(`🎯 Daily analysis complete: ${successCount} successful, ${errorCount} failed`)

    // Log summary to console (Vercel captures these logs)
    console.log('📊 Cron execution summary:')
    console.log(`- Total URLs processed: ${urlsToAnalyze.length}`)
    console.log(`- Successful analyses: ${successCount}`)
    console.log(`- Failed analyses: ${errorCount}`)
    console.log(`- Execution completed at: ${new Date().toISOString()}`)

    return res.status(200).json({
      success: true,
      message: 'Daily automatic analysis completed',
      summary: {
        total_urls: urlsToAnalyze.length,
        successful_analyses: successCount,
        failed_analyses: errorCount,
        execution_time: new Date().toISOString()
      },
      results
    })

  } catch (error) {
    console.error('Cron job failed:', error)
    return res.status(500).json({
      success: false,
      error: 'Daily analysis cron job failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}