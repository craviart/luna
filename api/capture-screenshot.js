// Screenshot capture with fallback options
// Primary: Puppeteer (when working)
// Fallback: Third-party screenshot service

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

  // Try fallback screenshot service first (more reliable)
  try {
    console.log('🔄 Using fallback screenshot service...')
    
    // Use screenshotapi.net (free tier available)
    const screenshotApiUrl = `https://screenshotapi.net/api/v1/screenshot`
    const params = new URLSearchParams({
      url: url,
      width: '1200',
      height: '800',
      output: 'image',
      file_type: 'jpeg',
      wait_for_event: 'load'
    })

    const screenshotResponse = await fetch(`${screenshotApiUrl}?${params}`, {
      method: 'GET'
    })

    if (screenshotResponse.ok) {
      const screenshot = await screenshotResponse.arrayBuffer()
      console.log('✅ Screenshot captured via fallback service')

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
        .upload(filename, Buffer.from(screenshot), {
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
        message: `Screenshot captured successfully in ${loadTime}s (via fallback service)`,
        image_url: publicUrl,
        capture_time: loadTime
      })
    }

  } catch (fallbackError) {
    console.error('Fallback screenshot service failed:', fallbackError)
    
    return res.status(500).json({
      success: false,
      error: 'Screenshot capture failed',
      details: fallbackError.message,
      fallback_attempted: true
    })
  }
}
