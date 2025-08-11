import puppeteer from 'puppeteer'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, urlId } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  // Check if this is a test capture (starts with 'test-')
  const isTestCapture = urlId && urlId.toString().startsWith('test-')

  console.log(`📸 Starting screenshot capture for: ${url}`)
  const startTime = Date.now()

  let browser
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()
    
    // Set viewport to standard desktop size
    await page.setViewport({ 
      width: 1200, 
      height: 800,
      deviceScaleFactor: 1
    })

    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Navigate to the page
    console.log(`🌐 Navigating to: ${url}`)
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })

    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000)

    // Take screenshot
    console.log(`📷 Capturing screenshot...`)
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false // Only above-the-fold
    })

    await browser.close()

    // Upload to Supabase Storage
    console.log(`☁️ Uploading to Supabase Storage...`)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `screenshots/${urlId}/${timestamp}.jpg`

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    // Upload screenshot
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('website-screenshots')
      .upload(filename, screenshot, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload screenshot' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('website-screenshots')
      .getPublicUrl(filename)

    // Save metadata to database (only for real monitored URLs, not test captures)
    if (!isTestCapture && urlId) {
      console.log(`💾 Saving metadata to database...`)
      const { data: dbData, error: dbError } = await supabase
        .from('website_screenshots')
        .insert({
          url_id: urlId,
          image_url: publicUrl,
          captured_at: new Date().toISOString(),
          viewport_width: 1200,
          viewport_height: 800
        })

      if (dbError) {
        console.error('Database error:', dbError)
        return res.status(500).json({ error: 'Failed to save screenshot metadata' })
      }
    } else {
      console.log(`🧪 Test capture - skipping database save`)
    }

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ Screenshot captured successfully in ${loadTime}s`)

    return res.status(200).json({
      success: true,
      message: `Screenshot captured successfully in ${loadTime}s`,
      image_url: publicUrl,
      capture_time: loadTime
    })

  } catch (error) {
    console.error('Screenshot capture error:', error)
    
    if (browser) {
      await browser.close().catch(console.error)
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to capture screenshot',
      details: error.message
    })
  }
}
