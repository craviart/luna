// AI Insights API endpoint using Google Gemini Flash
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
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable not set')
      return res.status(500).json({ error: 'AI service not configured' })
    }

    console.log('Generating AI insight with Gemini Flash...')
    
    // Call Google Gemini Flash API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9, // Increase randomness
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep it concise
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      if (response.status === 400) {
        return res.status(400).json({ error: 'Invalid request to AI service' })
      } else if (response.status === 401) {
        return res.status(500).json({ error: 'AI service authentication failed' })
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'AI service rate limit exceeded' })
      } else {
        return res.status(500).json({ error: 'AI service temporarily unavailable' })
      }
    }

    const result = await response.json()
    
    if (!result.candidates || result.candidates.length === 0) {
      console.error('No candidates in Gemini response:', result)
      return res.status(500).json({ error: 'AI service returned no results' })
    }

    const candidate = result.candidates[0]
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', candidate)
      return res.status(500).json({ error: 'AI service returned invalid response' })
    }

    const insight = candidate.content.parts[0].text?.trim()
    
    if (!insight) {
      console.error('Empty insight from Gemini')
      return res.status(500).json({ error: 'AI service returned empty response' })
    }

    console.log('Successfully generated AI insight')
    
    return res.status(200).json({
      success: true,
      insight: insight,
      model: 'gemini-1.5-flash'
    })

  } catch (error) {
    console.error('AI Insights API error:', error.message)
    return res.status(500).json({
      error: 'Failed to generate AI insight',
      details: error.message
    })
  }
}
