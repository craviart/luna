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

  // Try multiple screenshot services for reliability
  let screenshotBuffer = null
  let serviceUsed = 'unknown'
  
  // Option 1: Try shot.screenshotapi.net (simpler, no auth needed)
  try {
    console.log('🔄 Trying screenshot service 1...')
    const service1Url = `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=1200&height=800&output=image&file_type=jpeg&wait_for_event=load`
    
    const response1 = await fetch(service1Url, { method: 'GET' })
    if (response1.ok) {
      screenshotBuffer = await response1.arrayBuffer()
      serviceUsed = 'shot.screenshotapi.net'
      console.log('✅ Screenshot captured via service 1')
    } else {
      console.log(`⚠️ Service 1 failed: ${response1.status}`)
    }
  } catch (error) {
    console.log('⚠️ Service 1 error:', error.message)
  }

  // Option 2: Try API.APIFLASH.COM (backup service)
  if (!screenshotBuffer) {
    try {
      console.log('🔄 Trying screenshot service 2...')
      const service2Url = `https://api.apiflash.com/v1/urltoimage?access_key=demo&url=${encodeURIComponent(url)}&format=jpeg&width=1200&height=800&delay=2`
      
      const response2 = await fetch(service2Url, { method: 'GET' })
      if (response2.ok) {
        screenshotBuffer = await response2.arrayBuffer()
        serviceUsed = 'apiflash.com'
        console.log('✅ Screenshot captured via service 2')
      } else {
        console.log(`⚠️ Service 2 failed: ${response2.status}`)
      }
    } catch (error) {
      console.log('⚠️ Service 2 error:', error.message)
    }
  }

  // Option 3: Use placeholder generator as last resort
  if (!screenshotBuffer) {
    console.log('🔄 Using placeholder image as fallback...')
    const placeholderUrl = `https://via.placeholder.com/1200x800/f0f0f0/666666?text=${encodeURIComponent(url.replace(/https?:\/\//, ''))}`
    
    const placeholderResponse = await fetch(placeholderUrl)
    
    if (placeholderResponse.ok) {
      screenshotBuffer = await placeholderResponse.arrayBuffer()
      serviceUsed = 'placeholder'
      console.log('✅ Using placeholder image')
    }
  }

  // Check if we have any screenshot data
  if (screenshotBuffer) {
    console.log(`✅ Screenshot ready from: ${serviceUsed}`)

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
      .upload(filename, Buffer.from(screenshotBuffer), {
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
        message: `Screenshot captured successfully in ${loadTime}s (via ${serviceUsed})`,
        image_url: publicUrl,
        capture_time: loadTime,
        service_used: serviceUsed
      })
    }
  } else {
    // No screenshot could be captured from any service
    console.error('❌ All screenshot services failed')
    return res.status(500).json({
      success: false,
      error: 'All screenshot services failed',
      details: 'Unable to capture screenshot from any available service'
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
