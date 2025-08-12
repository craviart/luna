// PageSpeed-only analysis - no Puppeteer, fast and reliable
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('PageSpeed-only Analysis function started')
    const { url, urlId, isQuickTest } = req.body

    if (!url) {
      console.error('No URL provided in request body')
      return res.status(400).json({ error: 'URL is required' })
    }

    const analysisType = isQuickTest ? 'quick test' : 'monitored URL'
    console.log(`Starting PageSpeed-only ${analysisType} for:`, url)

    const startTime = Date.now()
    
    // Get performance metrics from PageSpeed Insights API
    console.log('Fetching performance data from PageSpeed Insights...')
    let performanceData = null
    let performanceScore = null
    let fcpTime = null
    let lcpTime = null
    let speedIndexTime = null
    let tbtTime = null
    let clsValue = null


      try {
        const apiKey = process.env.PAGESPEED_API_KEY
        const pageSpeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&locale=en${apiKey ? `&key=${apiKey}` : ''}`
        
        console.log(`PageSpeed API attempt ${attempt}/${maxRetries}:`, pageSpeedUrl.replace(apiKey || '', 'API_KEY_HIDDEN'))
        
        // Progressive timeout: 6s, 8s, 10s
        const timeoutMs = baseTimeout + (attempt - 1) * 2000
        console.log(`Using ${timeoutMs}ms timeout for attempt ${attempt}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        
        const pageSpeedResponse = await fetch(pageSpeedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Luna Analytics/1.0)'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
      
        if (!pageSpeedResponse.ok) {
          const errorText = await pageSpeedResponse.text()
          console.error('PageSpeed API error response:', errorText)
          throw new Error(`PageSpeed API HTTP ${pageSpeedResponse.status}: ${pageSpeedResponse.statusText}`)
        }
        
        const responseText = await pageSpeedResponse.text()
        console.log('PageSpeed API response received, parsing...')
        
        let pageSpeedData
        try {
          pageSpeedData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse PageSpeed API response as JSON:', parseError.message)
          throw new Error(`PageSpeed API returned invalid JSON: ${parseError.message}`)
        }
        
        if (pageSpeedData.error) {
          throw new Error(`PageSpeed API Error: ${pageSpeedData.error.message}`)
        }
        
        // Extract performance metrics
        if (pageSpeedData.lighthouseResult?.categories?.performance) {
          performanceScore = Math.round(pageSpeedData.lighthouseResult.categories.performance.score * 100)
          console.log('Performance Score:', performanceScore)
        }
        
        // Extract Core Web Vitals from audits and convert to proper types
        const audits = pageSpeedData.lighthouseResult?.audits || {}
        
        if (audits['first-contentful-paint']?.numericValue) {
          fcpTime = Math.round(audits['first-contentful-paint'].numericValue) // Convert to integer
          console.log('FCP from PageSpeed:', fcpTime, 'ms')
        }
        
        if (audits['largest-contentful-paint']?.numericValue) {
          lcpTime = Math.round(audits['largest-contentful-paint'].numericValue) // Convert to integer
          console.log('LCP from PageSpeed:', lcpTime, 'ms')
        }
        
        if (audits['speed-index']?.numericValue) {
          speedIndexTime = Math.round(audits['speed-index'].numericValue) // Convert to integer
          console.log('Speed Index from PageSpeed:', speedIndexTime, 'ms')
        }
        
        if (audits['total-blocking-time']?.numericValue) {
          tbtTime = Math.round(audits['total-blocking-time'].numericValue) // Convert to integer
          console.log('TBT from PageSpeed:', tbtTime, 'ms')
        }
        
        if (audits['cumulative-layout-shift']?.numericValue !== undefined) {
          clsValue = parseFloat(audits['cumulative-layout-shift'].numericValue.toFixed(3)) // Keep as float with 3 decimals
          console.log('CLS from PageSpeed:', clsValue)
        }
        
        performanceData = pageSpeedData
        console.log(`PageSpeed Insights data retrieved successfully on attempt ${attempt}`)
        
        // Success! Break out of retry loop
        break
        
      } catch (attemptError) {
        lastError = attemptError
        console.error(`PageSpeed attempt ${attempt} failed:`, attemptError.message)
        
        // Handle specific timeout errors
        if (attemptError.name === 'AbortError') {
          console.log(`PageSpeed API timed out after ${timeoutMs}ms on attempt ${attempt}`)
          lastError = new Error(`Analysis attempt ${attempt} timed out after ${timeoutMs/1000}s`)
        }
        
        // If this was the last attempt, don't wait
        if (attempt === maxRetries) {
          console.log('All PageSpeed retry attempts failed')
          break
        }
        
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const waitTime = Math.pow(2, attempt - 1) * 1000
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // If we exhausted all retries, throw the last error
    if (!performanceData && lastError) {
      if (lastError.message.includes('timed out')) {
        throw new Error('Analysis failed - PageSpeed API is experiencing timeouts. Please try again in a few minutes.')
      }
    }

    const loadTime = Math.round(Date.now() - startTime) // Ensure integer
    console.log('Analysis completed in:', loadTime, 'ms')

    // Save to database (unified approach for both monitored URLs and quick tests)
    if (isQuickTest) {
      console.log('Saving quick test result to database...')
      
      // Minimal data for quick tests - only store essential metrics
      const insertData = {
        url: url,
        analysis_result: {
          url: url,
          success: true,
          timestamp: new Date().toISOString(),
          performance_metrics: {
            performance_score: performanceScore || 0,
            fcp_time: fcpTime || 0,
            lcp_time: lcpTime || 0,
            speed_index: speedIndexTime || 0,
            total_blocking_time: tbtTime || 0,
            cumulative_layout_shift: clsValue || 0.0
          }
        },
        performance_score: performanceScore || 0,
        fcp_time: fcpTime || 0,
        lcp_time: lcpTime || 0,
        speed_index: speedIndexTime || 0,
        total_blocking_time: tbtTime || 0,
        cumulative_layout_shift: clsValue || 0.0,
        success: true
      }
      
      console.log('Quick test data to insert:', JSON.stringify(insertData, null, 2))
      
      const { error: insertError } = await supabase
        .from('quick_tests')
        .insert(insertData)

      if (insertError) {
        console.error('Quick test database save error:', insertError)
        throw new Error(`Failed to save quick test: ${insertError.message}`)
      }
      console.log('Quick test saved successfully')
    } else if (urlId) {
      console.log('Saving monitored URL analysis result to database...')
      const { error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          url_id: urlId,
          url: url,
          load_time: loadTime,
          performance_score: performanceScore || 0,
          fcp_time: fcpTime || 0,
          lcp_time: lcpTime || 0,
          speed_index: speedIndexTime || 0,
          total_blocking_time: tbtTime || 0,
          cumulative_layout_shift: clsValue || 0.0,
          // Removed lighthouse_data completely for maximum performance
          success: true
        })

      if (insertError) {
        console.error('Monitored URL database save error:', insertError)
        throw new Error(`Failed to save analysis: ${insertError.message}`)
      }
      console.log('Monitored URL analysis saved successfully')
    }

    const successMessage = isQuickTest 
      ? 'Quick test completed successfully (PageSpeed only)' 
      : 'Analysis completed successfully (PageSpeed only)'
    
    if (res.headersSent) {
      console.error('Response headers already sent')
      return
    }
    
    return res.status(200).json({
      success: true,
      message: successMessage,
      performance_metrics: {
        performance_score: performanceScore || 0,
        fcp_time: fcpTime || 0,
        lcp_time: lcpTime || 0,
        speed_index: speedIndexTime || 0,
        total_blocking_time: tbtTime || 0,
        cumulative_layout_shift: clsValue || 0.0
      },
      analysis_time: loadTime
    })

  } catch (error) {
    console.error('PageSpeed-only analysis error:', error.message)
    console.error('Error stack:', error.stack)

    if (res.headersSent) {
      console.error('Response headers already sent')
      return
    }

    return res.status(500).json({
      success: false,
      error: 'PageSpeed-only analysis failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}