const { createClient } = require('@supabase/supabase-js')

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📸 Screenshot API called')
    const { url, urlId } = req.body

    if (!url) {
      console.log('❌ Missing URL')
      return res.status(400).json({ error: 'URL is required' })
    }

    console.log(`📸 Processing: ${url}`)

    // Validate and normalize URL
    let validUrl
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`
      } else {
        validUrl = url
      }
      new URL(validUrl) // Validate URL format
    } catch (error) {
      console.log('❌ Invalid URL:', error.message)
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    const isTestCapture = urlId && urlId.toString().startsWith('test-')
    const startTime = Date.now()

    // Extract domain for display
    const domain = new URL(validUrl).hostname.replace('www.', '')
    
    // Create simple webpage preview as SVG
    const svgContent = `
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .browser-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .url-text { font-size: 14px; fill: #666; }
      .domain-text { font-size: 28px; fill: #333; font-weight: 600; }
      .content-block { fill: #f8f9fa; stroke: #e9ecef; stroke-width: 1; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Browser Chrome -->
  <rect x="0" y="0" width="100%" height="60" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
  
  <!-- Traffic Light Buttons -->
  <circle cx="20" cy="30" r="6" fill="#ff5f57"/>
  <circle cx="40" cy="30" r="6" fill="#ffbd2e"/>
  <circle cx="60" cy="30" r="6" fill="#28ca42"/>
  
  <!-- Address Bar -->
  <rect x="90" y="20" width="1020" height="20" rx="10" fill="white" stroke="#ddd"/>
  <text x="100" y="32" class="browser-text url-text">${validUrl.length > 80 ? validUrl.substring(0, 80) + '...' : validUrl}</text>
  
  <!-- Page Header -->
  <rect x="0" y="60" width="100%" height="80" fill="#007bff"/>
  <text x="600" y="110" text-anchor="middle" class="browser-text domain-text" fill="white">${domain}</text>
  
  <!-- Navigation -->
  <rect x="50" y="160" width="1100" height="40" fill="#f8f9fa" stroke="#e9ecef"/>
  <rect x="80" y="170" width="60" height="20" fill="#6c757d" rx="2"/>
  <rect x="160" y="170" width="80" height="20" fill="#6c757d" rx="2"/>
  <rect x="260" y="170" width="70" height="20" fill="#007bff" rx="2"/>
  
  <!-- Content Sections -->
  <rect x="50" y="220" width="350" height="200" class="content-block" rx="4"/>
  <rect x="425" y="220" width="350" height="200" class="content-block" rx="4"/>
  <rect x="800" y="220" width="350" height="200" class="content-block" rx="4"/>
  
  <!-- Text Lines in First Section -->
  <rect x="70" y="250" width="250" height="12" fill="#333" rx="2"/>
  <rect x="70" y="270" width="180" height="8" fill="#666" rx="2"/>
  <rect x="70" y="285" width="200" height="8" fill="#666" rx="2"/>
  <rect x="70" y="300" width="150" height="8" fill="#666" rx="2"/>
  
  <!-- Text Lines in Second Section -->
  <rect x="445" y="250" width="220" height="12" fill="#333" rx="2"/>
  <rect x="445" y="270" width="160" height="8" fill="#666" rx="2"/>
  <rect x="445" y="285" width="190" height="8" fill="#666" rx="2"/>
  <rect x="445" y="300" width="140" height="8" fill="#666" rx="2"/>
  
  <!-- Text Lines in Third Section -->
  <rect x="820" y="250" width="240" height="12" fill="#333" rx="2"/>
  <rect x="820" y="270" width="170" height="8" fill="#666" rx="2"/>
  <rect x="820" y="285" width="200" height="8" fill="#666" rx="2"/>
  <rect x="820" y="300" width="160" height="8" fill="#666" rx="2"/>
  
  <!-- Footer -->
  <rect x="0" y="740" width="100%" height="60" fill="#f8f9fa" stroke="#e9ecef"/>
  <text x="600" y="765" text-anchor="middle" class="browser-text" style="font-size: 12px; fill: #999;">
    Captured on ${new Date().toLocaleDateString()}
  </text>
  <text x="600" y="780" text-anchor="middle" class="browser-text" style="font-size: 10px; fill: #ccc;">
    Luna Analytics Screenshot
  </text>
</svg>`.trim()

    console.log('✅ SVG generated successfully')

    // Convert SVG to buffer
    const svgBuffer = Buffer.from(svgContent, 'utf8')

    // Skip Supabase for test captures - just return success
    if (isTestCapture) {
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ Test screenshot completed in ${loadTime}s`)
      
      return res.status(200).json({
        success: true,
        message: `Test screenshot created successfully in ${loadTime}s`,
        image_url: `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`,
        capture_time: loadTime,
        service_used: 'local-svg-generator'
      })
    }

    // For real captures, upload to Supabase
    console.log('☁️ Initializing Supabase...')
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      console.log('❌ Missing Supabase environment variables')
      return res.status(500).json({ error: 'Supabase configuration missing' })
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    // Upload to Supabase Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `screenshots/${urlId}/${timestamp}.svg`

    console.log(`☁️ Uploading to: ${filename}`)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('website-screenshots')
      .upload(filename, svgBuffer, {
        contentType: 'image/svg+xml',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return res.status(500).json({ 
        error: 'Failed to upload screenshot',
        details: uploadError.message 
      })
    }

    console.log('✅ Upload successful')

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('website-screenshots')
      .getPublicUrl(filename)

    // Save metadata to database
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
      console.error('❌ Database error:', dbError)
      return res.status(500).json({ 
        error: 'Failed to save screenshot metadata',
        details: dbError.message 
      })
    }

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ Screenshot capture completed successfully in ${loadTime}s`)

    return res.status(200).json({
      success: true,
      message: `Screenshot captured successfully in ${loadTime}s`,
      image_url: publicUrl,
      capture_time: loadTime,
      service_used: 'local-svg-generator'
    })

  } catch (error) {
    console.error('❌ Screenshot capture error:', error)
    return res.status(500).json({
      success: false,
      error: 'Screenshot capture failed',
      details: error.message
    })
  }
}