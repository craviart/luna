import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import AIWriter from 'react-aiwriter'

// Black animated loader component
const BlackLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '120px',
    width: '100%'
  }}>
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce1 1.4s ease-in-out infinite both'
      }}></div>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce2 1.4s ease-in-out infinite both'
      }}></div>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce3 1.4s ease-in-out infinite both'
      }}></div>
    </div>
    <style>{`
      @keyframes bounce1 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      @keyframes bounce2 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        24% { transform: scale(1); opacity: 1; }
      }
      @keyframes bounce3 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        8% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  </div>
)

export default function AIInsights({ performanceData, timeRange, loading }) {
  const [insight, setInsight] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Generate insight when performance data changes
  useEffect(() => {
    if (performanceData && performanceData.length > 0 && !loading) {
      generateInsight()
    }
  }, [performanceData, timeRange, loading])

  const generateInsight = async () => {
    try {
      setIsGenerating(true)
      
      // Prepare data for AI analysis
      const sites = performanceData.filter(url => url.latestAnalysis?.performance_score > 0).map(url => ({
        name: url.name || 'Unknown Site',
        score: url.latestAnalysis?.performance_score || 0,
        fcp: url.latestAnalysis?.fcp_time || 0,
        lcp: url.latestAnalysis?.lcp_time || 0,
      }))

      if (sites.length === 0) {
        setInsight("Add monitored pages to track how performance impacts your conversion rates and revenue.")
        setAnimationKey(prev => prev + 1)
        return
      }

      // Calculate trends
      const avgScore = Math.round(sites.reduce((sum, s) => sum + s.score, 0) / sites.length)
      const goodSites = sites.filter(s => s.score >= 90).length
      const poorSites = sites.filter(s => s.score < 50).length
      const avgFCP = Math.round(sites.reduce((sum, s) => sum + s.fcp, 0) / sites.length)
      const avgLCP = Math.round(sites.reduce((sum, s) => sum + s.lcp, 0) / sites.length)

      // Add randomization to get different insights each time
      const focusAreas = [
        "conversion rate optimization and revenue impact",
        "user experience and customer satisfaction", 
        "technical performance thresholds and Core Web Vitals",
        "competitive advantage through faster loading times",
        "mobile performance and mobile commerce impact",
        "bounce rate reduction and engagement metrics"
      ]
      
      const perspectives = [
        "from a business strategy standpoint",
        "from a technical optimization perspective", 
        "from a user experience angle",
        "from a revenue generation viewpoint",
        "from a competitive positioning perspective"
      ]
      
      const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)]
      const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)]
      const timestamp = Date.now()
      const randomSeed = Math.floor(Math.random() * 10000)

      // Log the randomization for debugging
      console.log('AI Insight Generation:', {
        randomFocus,
        randomPerspective,
        randomSeed,
        timestamp
      })

      const prompt = `You are a front-end developer and web performance expert working for an ecommerce website. You're responsible for helping people understand how performance directly impacts conversion rates and business success. As an engineer, provide precise technical insights while emphasizing business impact.

IMPORTANT: Generate a completely unique response each time. Do not repeat previous responses.

Current timestamp: ${timestamp}
Analysis ID: ${randomSeed}
Focus: ${randomFocus}
Perspective: ${randomPerspective}

Analyze this ecommerce website performance data and provide 1-2 sentences that connect technical metrics to business outcomes:

SITES PERFORMANCE:
${sites.map(site => 
  `• ${site.name}: ${site.score}/100 (FCP: ${site.fcp}ms, LCP: ${site.lcp}ms)`
).join('\n')}

SUMMARY:
• Time period: ${timeRange}
• Average score: ${avgScore}/100
• Sites performing well (90+): ${goodSites}
• Sites needing attention (<50): ${poorSites}
• Average FCP: ${avgFCP}ms
• Average LCP: ${avgLCP}ms

Write from the ${randomPerspective} focusing on ${randomFocus}. Use different wording and structure than any previous response. Be technically precise but emphasize business impact.`

      // Call AI API
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('AI Response received:', {
          success: result.success,
          insightPreview: result.insight?.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        })
        if (result.success && result.insight) {
          setInsight(result.insight)
          setAnimationKey(prev => prev + 1)
        } else {
          throw new Error('AI service returned no insight')
        }
      } else {
        console.error('AI API failed:', response.status, response.statusText)
        throw new Error('AI service unavailable')
      }

    } catch (error) {
      console.error('AI insight generation failed:', error)
      // Fallback to rule-based insight
      const fallbackInsight = generateFallbackInsight()
      setInsight(fallbackInsight)
      setAnimationKey(prev => prev + 1)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate fallback insight with ecommerce performance focus
  const generateFallbackInsight = () => {
    const sites = performanceData.filter(url => url.latestAnalysis?.performance_score > 0)
    if (sites.length === 0) {
      return "Add monitored pages to track how performance impacts your conversion rates and revenue."
    }

    const avgScore = Math.round(sites.reduce((sum, s) => sum + s.latestAnalysis.performance_score, 0) / sites.length)
    const poorSites = sites.filter(s => s.latestAnalysis.performance_score < 50).length
    const goodSites = sites.filter(s => s.latestAnalysis.performance_score >= 90).length
    const avgFCP = Math.round(sites.reduce((sum, s) => sum + (s.latestAnalysis?.fcp_time || 0), 0) / sites.length)
    const avgLCP = Math.round(sites.reduce((sum, s) => sum + (s.latestAnalysis?.lcp_time || 0), 0) / sites.length)

    if (avgScore >= 80 && avgFCP <= 1800 && avgLCP <= 2500) {
      return `Excellent performance! Your ${avgScore}/100 average score with FCP under 1.8s optimizes for maximum conversion rates.`
    } else if (poorSites > 0) {
      return `${poorSites} page${poorSites > 1 ? 's have' : ' has'} scores below 50, potentially reducing conversion rates by up to 20%. Prioritize Core Web Vitals optimization.`
    } else if (avgFCP > 1800 || avgLCP > 2500) {
      return `FCP at ${(avgFCP/1000).toFixed(1)}s or LCP at ${(avgLCP/1000).toFixed(1)}s may impact conversion rates. Target FCP <1.8s and LCP <2.5s for optimal ecommerce performance.`
    } else {
      return `${avgScore}/100 performance score indicates room for conversion rate optimization through faster Core Web Vitals.`
    }
  }

  // Don't render anything while initial loading or if no data
  if (loading || (!performanceData?.length && !isGenerating)) {
    return null
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="w-full">
          {isGenerating ? (
            <BlackLoader />
          ) : insight ? (
            <div 
              className="text-[20px] leading-[1.5] sm:text-[32px] sm:leading-[1.4]"
              style={{
                color: 'hsl(var(--foreground))',
                fontWeight: '400'
              }}
            >
              <AIWriter
                key={`insight-${animationKey}-${insight.length}`}
                delay={80}
              >
                <span>{insight}</span>
              </AIWriter>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
