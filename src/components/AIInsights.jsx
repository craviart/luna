import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

export default function AIInsights({ performanceData, timeRange, loading }) {
  const [insight, setInsight] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [lastGenerated, setLastGenerated] = useState(null)

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
      } else {
        throw new Error(result.error || 'Failed to generate insight')
      }

    } catch (err) {
      console.error('AI Insight generation error:', err)
      setError(err.message)
      // Fallback to rule-based insight
      setInsight(generateFallbackInsight(performanceData))
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

  if (loading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Performance Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">Powered by Gemini</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing performance data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Performance Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">Powered by Gemini</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isGenerating}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          AI-powered analysis of your website performance trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-start gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">AI insights temporarily unavailable</p>
              <p className="text-xs text-muted-foreground">{insight}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating insights...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                {insight || "Analyzing your performance data..."}
              </p>
            )}
            {lastGenerated && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(lastGenerated).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
