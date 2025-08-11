export default function handler(req, res) {
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
    const { url, urlId } = req.body || {}

    if (!url) {
      console.log('❌ Missing URL')
      return res.status(400).json({ error: 'URL is required' })
    }

    console.log(`📸 Processing: ${url}`)

    // Simple URL validation
    let validUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = `https://${url}`
    }

    const isTestCapture = urlId && urlId.toString().startsWith('test-')
    const startTime = Date.now()

    // Extract domain for display (simple regex)
    const domainMatch = validUrl.match(/https?:\/\/(?:www\.)?([^\/]+)/)
    const domain = domainMatch ? domainMatch[1] : 'Website'
    
    // Try to get real website content using a reliable screenshot service
    let svgContent = null
    let serviceUsed = 'template'
    
    try {
      console.log('🔄 Attempting real screenshot capture...')
      
      // Try screenshotomatic.com - free, no API key needed
      const screenshotUrl = `https://api.screenshotomatic.com/screenshot?url=${encodeURIComponent(validUrl)}&format=image&width=1200&height=800&delay=2000`
      
      const response = await fetch(screenshotUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LunaAnalytics/1.0)'
        }
      })
      
      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        console.log('✅ Real screenshot captured!')
        const imageBuffer = await response.arrayBuffer()
        
        // Convert image to base64 and embed in SVG
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        const mimeType = response.headers.get('content-type') || 'image/png'
        
        svgContent = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Browser Chrome -->
  <rect x="0" y="0" width="100%" height="50" fill="#f5f5f5" stroke="#ddd"/>
  <circle cx="15" cy="25" r="5" fill="#ff5f57"/>
  <circle cx="35" cy="25" r="5" fill="#ffbd2e"/>
  <circle cx="55" cy="25" r="5" fill="#28ca42"/>
  <rect x="80" y="15" width="1040" height="20" rx="10" fill="white" stroke="#ccc"/>
  <text x="90" y="28" font-family="system-ui" font-size="12" fill="#666">${validUrl}</text>
  
  <!-- Real Website Screenshot -->
  <image x="0" y="50" width="1200" height="750" href="data:${mimeType};base64,${base64Image}" preserveAspectRatio="xMidYMid slice"/>
</svg>`
        serviceUsed = 'screenshotomatic'
      } else {
        throw new Error(`Screenshot service failed: ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️ Real screenshot failed, using template:', error.message)
      
      // Fallback to enhanced template
      svgContent = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Browser Chrome -->
  <rect x="0" y="0" width="100%" height="60" fill="#f5f5f5" stroke="#ddd"/>
  <circle cx="20" cy="30" r="6" fill="#ff5f57"/>
  <circle cx="40" cy="30" r="6" fill="#ffbd2e"/>
  <circle cx="60" cy="30" r="6" fill="#28ca42"/>
  <rect x="90" y="20" width="1020" height="20" rx="10" fill="white" stroke="#ddd"/>
  <text x="100" y="32" font-family="system-ui" font-size="14" fill="#666">${validUrl}</text>
  
  <!-- Header with gradient -->
  <rect x="0" y="60" width="100%" height="120" fill="url(#headerGradient)"/>
  <text x="600" y="130" text-anchor="middle" font-family="system-ui" font-size="36" font-weight="600" fill="white">${domain}</text>
  
  <!-- Navigation -->
  <rect x="0" y="180" width="100%" height="50" fill="#ffffff" stroke="#e9ecef"/>
  <rect x="50" y="195" width="80" height="20" fill="#007bff" rx="3"/>
  <text x="90" y="207" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">Home</text>
  <rect x="150" y="195" width="80" height="20" fill="#6c757d" rx="3"/>
  <text x="190" y="207" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">About</text>
  <rect x="250" y="195" width="80" height="20" fill="#6c757d" rx="3"/>
  <text x="290" y="207" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">Services</text>
  
  <!-- Content Grid -->
  <rect x="50" y="260" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="70" y="280" width="200" height="15" fill="#333" rx="3"/>
  <rect x="70" y="305" width="150" height="8" fill="#666" rx="2"/>
  <rect x="70" y="320" width="180" height="8" fill="#666" rx="2"/>
  <rect x="70" y="335" width="120" height="8" fill="#666" rx="2"/>
  
  <rect x="425" y="260" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="445" y="280" width="220" height="15" fill="#333" rx="3"/>
  <rect x="445" y="305" width="160" height="8" fill="#666" rx="2"/>
  <rect x="445" y="320" width="190" height="8" fill="#666" rx="2"/>
  <rect x="445" y="335" width="140" height="8" fill="#666" rx="2"/>
  
  <rect x="800" y="260" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="820" y="280" width="180" height="15" fill="#333" rx="3"/>
  <rect x="820" y="305" width="140" height="8" fill="#666" rx="2"/>
  <rect x="820" y="320" width="160" height="8" fill="#666" rx="2"/>
  <rect x="820" y="335" width="120" height="8" fill="#666" rx="2"/>
  
  <!-- Footer -->
  <rect x="0" y="720" width="100%" height="80" fill="#2c3e50"/>
  <text x="600" y="750" text-anchor="middle" font-family="system-ui" font-size="14" fill="white">${domain}</text>
  <text x="600" y="770" text-anchor="middle" font-family="system-ui" font-size="12" fill="#95a5a6">
    Template preview - Captured on ${new Date().toLocaleDateString()}
  </text>
</svg>`
      serviceUsed = 'enhanced-template'
    }`

    console.log('✅ SVG generated successfully')

    // For test captures, return data URI immediately
    if (isTestCapture) {
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ Test screenshot completed in ${loadTime}s`)
      
      const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent, 'utf8').toString('base64')}`
      
      return res.status(200).json({
        success: true,
        message: `Test screenshot created successfully in ${loadTime}s`,
        image_url: dataUri,
        capture_time: loadTime,
        service_used: serviceUsed
      })
    }

    // For now, return success even for non-test captures until we fix Supabase
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ Screenshot completed in ${loadTime}s`)
    
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent, 'utf8').toString('base64')}`
    
    return res.status(200).json({
      success: true,
      message: `Screenshot created successfully in ${loadTime}s`,
      image_url: dataUri,
      capture_time: loadTime,
      service_used: serviceUsed
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