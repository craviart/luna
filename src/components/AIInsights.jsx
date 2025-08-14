import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { TypeAnimation } from 'react-type-animation'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

export default function AIInsights({ performanceData, timeRange, loading }) {
  const [insight, setInsight] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [lastGenerated, setLastGenerated] = useState(null)
  const [animationKey, setAnimationKey] = useState(0)

  // Generate insight when performance data changes
  useEffect(() => {
    if (performanceData && performanceData.length > 0 && !loading) {
      generateInsight()
    }
  }, [performanceData, timeRange, loading])

  const generateInsight = async (forceRefresh = false) => {
    // Don't regenerate if we just generated one (unless forced)
    if (!forceRefresh && lastGenerated && Date.now() - lastGenerated < 30000) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Prepare performance data for AI analysis
      const analysisData = prepareDataForAnalysis(performanceData, timeRange)
      
      if (!analysisData.sites.length) {
        setInsight("No performance data available yet. Add some monitored websites to get AI-powered insights!")
        setIsGenerating(false)
        return
      }

      const prompt = createAnalysisPrompt(analysisData)
      
      // Call Google Gemini API
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.insight) {
        setInsight(result.insight)
        setLastGenerated(Date.now())
        // Force re-render of TypeAnimation by changing key
        setAnimationKey(prev => prev + 1)
      } else {
        throw new Error(result.error || 'Failed to generate insight')
      }

    } catch (err) {
      console.error('AI Insight generation error:', err)
      setError(err.message)
      // Fallback to rule-based insight
      setInsight(generateFallbackInsight(performanceData))
      // Force re-render of TypeAnimation for fallback
      setAnimationKey(prev => prev + 1)
    } finally {
      setIsGenerating(false)
    }
  }

  const prepareDataForAnalysis = (data, timeRange) => {
    if (!data || !Array.isArray(data)) {
      return { sites: [], timeRange, trends: {} }
    }

    const sites = data.map(site => ({
      name: site.name || 'Unknown Site',
      score: site.latestAnalysis?.performance_score || 0,
      fcp: site.latestAnalysis?.fcp_time || 0,
      lcp: site.latestAnalysis?.lcp_time || 0,
      lastAnalyzed: site.latestAnalysis?.created_at
    })).filter(site => site.score > 0) // Only include sites with data

    // Calculate some basic trends
    const avgScore = sites.length > 0 ? Math.round(sites.reduce((sum, s) => sum + s.score, 0) / sites.length) : 0
    const goodSites = sites.filter(s => s.score >= 90).length
    const poorSites = sites.filter(s => s.score < 50).length
    const avgFCP = sites.length > 0 ? Math.round(sites.reduce((sum, s) => sum + s.fcp, 0) / sites.length) : 0
    const avgLCP = sites.length > 0 ? Math.round(sites.reduce((sum, s) => sum + s.lcp, 0) / sites.length) : 0

    return {
      sites,
      timeRange,
      trends: {
        avgScore,
        goodSites,
        poorSites,
        avgFCP,
        avgLCP,
        totalSites: sites.length
      }
    }
  }

  const createAnalysisPrompt = (data) => {
    return `Analyze this website performance data and provide 1-2 sentences of actionable insight in a professional but conversational tone:

SITES PERFORMANCE:
${data.sites.map(site => 
  `• ${site.name}: ${site.score}/100 (FCP: ${site.fcp}ms, LCP: ${site.lcp}ms)`
).join('\n')}

SUMMARY:
• Time period: ${data.timeRange}
• Average score: ${data.trends.avgScore}/100
• Sites performing well (90+): ${data.trends.goodSites}
• Sites needing attention (<50): ${data.trends.poorSites}
• Average FCP: ${data.trends.avgFCP}ms
• Average LCP: ${data.trends.avgLCP}ms

Focus on the most important insight: overall health, concerning trends, specific recommendations, or notable achievements. Be concise and actionable.`
  }

  const generateFallbackInsight = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "Add some monitored websites to get performance insights and recommendations."
    }

    const sites = data.filter(site => site.latestAnalysis?.performance_score > 0)
    if (sites.length === 0) {
      return "Your monitored sites are being analyzed. Check back soon for AI-powered performance insights!"
    }

    const avgScore = Math.round(sites.reduce((sum, s) => sum + s.latestAnalysis.performance_score, 0) / sites.length)
    const poorSites = sites.filter(s => s.latestAnalysis.performance_score < 50).length
    const goodSites = sites.filter(s => s.latestAnalysis.performance_score >= 90).length

    if (avgScore >= 80) {
      return `Your sites are performing well with an average score of ${avgScore}/100. ${goodSites > 0 ? `${goodSites} site${goodSites > 1 ? 's' : ''} scored 90+!` : 'Keep up the great work!'}`
    } else if (poorSites > 0) {
      return `${poorSites} site${poorSites > 1 ? 's need' : ' needs'} attention with scores below 50. Focus on optimizing images, reducing JavaScript, and improving server response times.`
    } else {
      return `Average performance score is ${avgScore}/100. Consider optimizing Core Web Vitals to improve user experience and SEO rankings.`
    }
  }

  const handleRefresh = () => {
    generateInsight(true)
  }

  // Don't render anything while loading
  if (loading || (!insight && !isGenerating)) {
    return null
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground flex-shrink-0" />
                <span className="text-base text-muted-foreground">Generating insights...</span>
              </div>
            ) : insight ? (
              <TypeAnimation
                key={animationKey}
                sequence={[insight]}
                wrapper="div"
                cursor={false}
                speed={75}
                style={{
                  fontSize: '24px',
                  lineHeight: '1.4',
                  color: 'hsl(var(--foreground))',
                  fontWeight: '400'
                }}
                className="sm:text-2xl text-xl leading-relaxed"
              />
            ) : null}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isGenerating}
            className="h-9 w-9 p-0 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
