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
    const { url } = req.body || {}
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Simple SVG response
    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
          Screenshot API Working!
        </text>
        <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
          URL: ${url}
        </text>
      </svg>
    `

    const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svgContent.trim()).toString('base64')

    return res.status(200).json({
      success: true,
      message: 'Basic screenshot API working',
      image_url: dataUri,
      capture_time: '0.1',
      service_used: 'Basic Test'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
