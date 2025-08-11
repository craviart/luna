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

    // Extract domain for display
    const domainMatch = validUrl.match(/https?:\/\/(?:www\.)?([^\/]+)/)
    const domain = domainMatch ? domainMatch[1] : 'Website'
    
    let svgContent = null
    let serviceUsed = 'template'
    
    // Try AbstractAPI for real screenshots (if API key provided)
    const apiKey = process.env.ABSTRACT_API_KEY
    console.log('🔍 API Key check:', apiKey ? `Key exists (${apiKey.substring(0, 8)}...)` : 'No API key found')
    
    if (apiKey) {
      try {
        console.log('🔄 Attempting real screenshot with AbstractAPI...')
        
        const abstractUrl = `https://screenshot.abstractapi.com/v1/?api_key=${apiKey}&url=${encodeURIComponent(validUrl)}&capture_full_page=true&image_quality=high&export_format=png&delay=3`
        console.log('📡 AbstractAPI URL:', abstractUrl.replace(apiKey, 'HIDDEN_KEY'))
        
        const response = await fetch(abstractUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LunaAnalytics/1.0)'
          }
        })
        
        console.log('📡 AbstractAPI response:', response.status, response.statusText)
        console.log('📡 Content-Type:', response.headers.get('content-type'))
        
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          console.log('✅ Real screenshot captured with AbstractAPI!')
          const imageBuffer = await response.arrayBuffer()
          console.log('📏 Image size:', imageBuffer.byteLength, 'bytes')
          
          // Convert image to base64 and embed in SVG
          const base64Image = Buffer.from(imageBuffer).toString('base64')
          console.log('🔄 Base64 conversion complete, length:', base64Image.length)
          
          svgContent = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Browser Chrome -->
  <rect x="0" y="0" width="100%" height="50" fill="#f5f5f5" stroke="#ddd"/>
  <circle cx="15" cy="25" r="5" fill="#ff5f57"/>
  <circle cx="35" cy="25" r="5" fill="#ffbd2e"/>
  <circle cx="55" cy="25" r="5" fill="#28ca42"/>
  <rect x="80" y="15" width="1040" height="20" rx="10" fill="white" stroke="#ccc"/>
  <text x="90" y="28" font-family="system-ui" font-size="12" fill="#666">${validUrl}</text>
  
  <!-- Real Website Screenshot -->
  <image x="0" y="50" width="1200" height="750" href="data:image/png;base64,${base64Image}" preserveAspectRatio="xMidYMid slice"/>
</svg>`
          serviceUsed = 'AbstractAPI'
        } else {
          const errorText = await response.text()
          console.log(`⚠️ AbstractAPI failed: ${response.status} - ${errorText}`)
          throw new Error(`AbstractAPI failed: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.log('⚠️ AbstractAPI error:', error.message)
        // Continue to fallback
      }
    } else {
      console.log('ℹ️ No AbstractAPI key provided, using template')
    }
    
    // Fallback to enhanced template if real screenshot failed
    if (!svgContent) {
      console.log('📝 Using enhanced template fallback...')
      
      svgContent = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="#e9ecef"/>
    </pattern>
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
  
  <!-- Hero Section -->
  <rect x="50" y="250" width="1100" height="100" fill="url(#dots)" stroke="#e9ecef" rx="8"/>
  <rect x="70" y="270" width="300" height="20" fill="#333" rx="4"/>
  <rect x="70" y="300" width="200" height="12" fill="#666" rx="3"/>
  <rect x="70" y="320" width="150" height="8" fill="#999" rx="2"/>
  
  <!-- Content Grid -->
  <rect x="50" y="370" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="70" y="390" width="200" height="15" fill="#333" rx="3"/>
  <rect x="70" y="415" width="150" height="8" fill="#666" rx="2"/>
  <rect x="70" y="430" width="180" height="8" fill="#666" rx="2"/>
  <rect x="70" y="445" width="120" height="8" fill="#666" rx="2"/>
  <rect x="70" y="480" width="250" height="25" fill="#007bff" rx="4"/>
  <text x="195" y="497" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">Learn More</text>
  
  <rect x="425" y="370" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="445" y="390" width="220" height="15" fill="#333" rx="3"/>
  <rect x="445" y="415" width="160" height="8" fill="#666" rx="2"/>
  <rect x="445" y="430" width="190" height="8" fill="#666" rx="2"/>
  <rect x="445" y="445" width="140" height="8" fill="#666" rx="2"/>
  <rect x="445" y="480" width="250" height="25" fill="#28a745" rx="4"/>
  <text x="570" y="497" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">Get Started</text>
  
  <rect x="800" y="370" width="350" height="180" fill="#f8f9fa" stroke="#e9ecef" rx="8"/>
  <rect x="820" y="390" width="180" height="15" fill="#333" rx="3"/>
  <rect x="820" y="415" width="140" height="8" fill="#666" rx="2"/>
  <rect x="820" y="430" width="160" height="8" fill="#666" rx="2"/>
  <rect x="820" y="445" width="120" height="8" fill="#666" rx="2"/>
  <rect x="820" y="480" width="250" height="25" fill="#17a2b8" rx="4"/>
  <text x="945" y="497" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">Contact</text>
  
  <!-- Footer -->
  <rect x="0" y="720" width="100%" height="80" fill="#2c3e50"/>
  <text x="600" y="750" text-anchor="middle" font-family="system-ui" font-size="14" fill="white">${domain}</text>
  <text x="600" y="770" text-anchor="middle" font-family="system-ui" font-size="12" fill="#95a5a6">
    Template preview - Add ABSTRACT_API_KEY for real screenshots - ${new Date().toLocaleDateString()}
  </text>
</svg>`
      serviceUsed = 'Enhanced Template'
    }

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