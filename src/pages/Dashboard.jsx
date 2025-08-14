import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  Zap, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  TestTube,
  Activity,
  Globe,
  TrendingUp,
  Info
} from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  ReferenceLine
} from 'recharts'
import { supabase } from '../lib/supabase-simple'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../components/ui/hover-card'
import AIInsights from '../components/AIInsights'

export default function Dashboard() {
  const [monitoredUrls, setMonitoredUrls] = useState([])
  const [allAnalyses, setAllAnalyses] = useState([])
  const [quickTests, setQuickTests] = useState([])
  const [chartData, setChartData] = useState({
    fcp: [],
    lcp: [],
    performance: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [cachedInsight, setCachedInsight] = useState('')

  // Helper function to get date range based on selected time range
  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    
    switch (timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
      case '3m':
        start.setMonth(now.getMonth() - 3)
        break
      default:
        start.setDate(now.getDate() - 7)
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (time) => {
    if (!time) return 'N/A'
    return `${(time / 1000).toFixed(2)}s`
  }

  // Animated Time Component
  const AnimatedTime = ({ time, className = "" }) => {
    if (!time) return <span className={className}>N/A</span>
    
    const seconds = time / 1000
    return (
      <span className={className}>
        <NumberFlow 
          value={seconds} 
          format={{ 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }}
          suffix="s"
          willChange
        />
      </span>
    )
  }

  const getPerformanceColor = (score) => {
    if (!score) return 'hsl(var(--muted-foreground))'
    if (score >= 90) return 'hsl(142, 76%, 36%)'  // green
    if (score >= 50) return 'hsl(45, 93%, 47%)'   // amber
    return 'hsl(0, 84%, 60%)'                     // red
  }

  const getFCPColor = (fcp) => {
    if (!fcp) return 'hsl(var(--muted-foreground))'
    if (fcp <= 1800) return 'hsl(142, 76%, 36%)'  // green
    if (fcp <= 3000) return 'hsl(45, 93%, 47%)'   // amber
    return 'hsl(0, 84%, 60%)'                     // red
  }

  const getLCPColor = (lcp) => {
    if (!lcp) return 'hsl(var(--muted-foreground))'
    if (lcp <= 2500) return 'hsl(142, 76%, 36%)'  // green
    if (lcp <= 4000) return 'hsl(45, 93%, 47%)'   // amber
    return 'hsl(0, 84%, 60%)'                     // red
  }

  // Colored Badge Component
  const ColoredBadge = ({ value, color, children, variant = "outline" }) => (
    <Badge variant={variant} className={`flex items-center gap-1 ${variant === "ghost" ? "border-0" : ""}`}>
      <div 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      {children || value}
    </Badge>
  )

  // Clean URL display function - remove protocol and www for cooler look
  const cleanUrl = (url) => {
    if (!url) return url
    
    return url
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/^www\./, '')       // Remove www.
  }

  // Generate AI insights when data changes
  const generateAIInsight = async (urlsData) => {
    try {
      
      // Prepare data for AI analysis
      const sites = urlsData.filter(url => url.latestAnalysis?.performance_score > 0).map(url => ({
        name: url.name || 'Unknown Site',
        score: url.latestAnalysis?.performance_score || 0,
        fcp: url.latestAnalysis?.fcp_time || 0,
        lcp: url.latestAnalysis?.lcp_time || 0,
      }))

      if (sites.length === 0) {
        setCachedInsight("Add monitored pages to track how performance impacts your conversion rates and revenue.")
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

      // Call AI API with retry logic for rate limits
      let response
      let lastError
      const maxRetries = 3
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`AI API attempt ${attempt}/${maxRetries}`)
          
          response = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          })
          
          // If successful or non-rate-limit error, break
          if (response.ok || response.status !== 429) {
            break
          }
          
          // If rate limited, wait before retry
          if (response.status === 429 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
            console.log(`Rate limited, waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
          
        } catch (error) {
          lastError = error
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000
            console.log(`Network error, waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
      }

      // Handle case where all retries failed
      if (!response) {
        throw lastError || new Error('Failed to connect to AI service after retries')
      }

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.insight) {
          setCachedInsight(result.insight)
        } else {
          throw new Error('AI service returned no insight')
        }
      } else {
        let errorText = ''
        try {
          const errorData = await response.json()
          errorText = errorData.error || response.statusText
        } catch {
          errorText = response.statusText
        }
        console.error('AI API failed:', response.status, errorText)
        throw new Error(`AI service unavailable: ${errorText}`)
      }

    } catch (error) {
      console.error('AI insight generation failed:', error)
      
      // Check if it's a configuration issue
      if (error.message.includes('AI service not configured')) {
        setCachedInsight("🔧 AI insights need configuration. Please add the GEMINI_API_KEY environment variable in Vercel.")
      } else if (error.message.includes('not configured')) {
        setCachedInsight("🔧 AI insights need configuration. Please add the GEMINI_API_KEY environment variable in Vercel.")
      } else if (error.message.includes('rate limit exceeded')) {
        setCachedInsight("⏱️ AI insights are rate limited. Refresh in a few moments for fresh insights from your performance data.")
      } else {
        // Simple fallback without excessive variations
        setCachedInsight("Performance insights are temporarily unavailable. Your current metrics show areas for ecommerce optimization.")
      }
    } finally {
      // No cleanup needed since we're not showing loading state
    }
  }

  // Speedometer Component using shadcn Radial Chart
  const SpeedometerChart = React.memo(({ score, analysisDate }) => {
    const [animatedScore, setAnimatedScore] = useState(score || 0) // Start with actual score
    const hasAnimatedRef = useRef(new Set()) // Track which scores we've animated
    const actualScore = score || 0
    
    // Only animate when we haven't animated this score before
    useEffect(() => {
      const hasAnimated = hasAnimatedRef.current.has(actualScore)
      
      console.log(`🎯 SpeedometerChart (${actualScore}) useEffect:`, {
        actualScore,
        hasAnimated,
        animatedScores: Array.from(hasAnimatedRef.current),
        willAnimate: !hasAnimated
      })
      
      // Only animate if we haven't animated this exact score before
      if (!hasAnimated) {
        console.log(`🚀 Starting animation: ${actualScore}`)
        hasAnimatedRef.current.add(actualScore) // Mark this score as animated
        
        // Start from 0 and animate to actual score
        setAnimatedScore(0)
        const timer = setTimeout(() => {
          setAnimatedScore(actualScore)
        }, 100)
        
        return () => clearTimeout(timer)
      } else {
        console.log(`⏭️ Skipping animation for ${actualScore} (already animated)`)
      }
    }, [actualScore])
    
    // Chart data - desktop shows the score, mobile shows the remaining portion
    const chartData = [
      {
        month: "performance",
        desktop: animatedScore,
        mobile: 100 - animatedScore, // Rest of the semicircle
      },
    ]
    
    const chartConfig = {
      desktop: {
        label: "Performance",
        color: getPerformanceColor(score),
      },
      mobile: {
        label: "Remaining",
        color: "hsl(var(--muted))",
      },
    }
    
    const totalScore = animatedScore
    
    // Format the analysis date
    const formatAnalysisDate = (date) => {
      if (!date) return 'No data'
      const analysisDate = new Date(date)
      return analysisDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return (
      <div className="mx-auto aspect-square max-h-[250px]">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={140}
          >
            <PolarRadiusAxis tick={false} tickCount={3} axisLine={false} />
            <RadialBar dataKey="desktop" stackId="a" cornerRadius={5} fill={getPerformanceColor(score)} className="stroke-transparent stroke-2" />
            <RadialBar dataKey="mobile" fill="hsl(var(--muted))" stackId="a" cornerRadius={5} className="stroke-transparent stroke-2" />
          </RadialBarChart>
        </ChartContainer>
        
        {/* Score text overlay - positioned in center */}
        <div className="relative -mt-40 flex flex-col items-center justify-center space-y-1">
          <div className="text-center">
            <div className="text-4xl font-bold">
              {Math.round(animatedScore)}
            </div>
            <div className="text-xs text-muted-foreground">{formatAnalysisDate(analysisDate)}</div>
          </div>
        </div>
      </div>
    )
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when props haven't actually changed
    return prevProps.score === nextProps.score && 
           prevProps.analysisDate === nextProps.analysisDate
  })



  const processChartData = (analyses) => {
    // Group by date and URL
    const dataByDate = {}
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
      
      if (!dataByDate[date]) {
        dataByDate[date] = {}
      }
      
      const urlName = analysis.urls?.name || 'Unknown'
      
      // Store latest values for each URL on each date
      dataByDate[date][urlName] = {
        fcp_time: analysis.fcp_time || null,
        lcp_time: analysis.lcp_time || null,
        performance_score: analysis.performance_score || null
      }
    })
    
    // Get unique URL names first
    const urlNames = [...new Set(analyses.map(a => a.urls?.name).filter(Boolean))]
    
    // Convert to chart format and ensure all URLs have entries for all dates
    const chartDataArray = Object.entries(dataByDate).map(([date, urlData]) => {
      const entry = { date }
      
      // Add data for each URL, ensuring all URLs are represented
      urlNames.forEach(urlName => {
        const metrics = urlData[urlName] || { fcp_time: null, lcp_time: null, performance_score: null }
        entry[`${urlName}_fcp`] = metrics.fcp_time
        entry[`${urlName}_lcp`] = metrics.lcp_time
        entry[`${urlName}_performance`] = metrics.performance_score
      })
      
      return entry
    })
    
    return {
      data: chartDataArray,
      urlNames
    }
  }

  // Chart configurations for different metrics using blue theme colors
  const getChartConfig = (urlNames, metricType) => {
    const config = {}
    // Clear blue color differentiation: blue-200, blue-400, blue-600
    const blueThemeColors = [
      '#bfdbfe',   // blue-200 - lightest
      '#60a5fa',   // blue-400 - medium  
      '#2563eb',   // blue-600 - darkest
    ]
    
    urlNames.forEach((urlName, index) => {
      const color = blueThemeColors[index % blueThemeColors.length]
      config[`${urlName}_${metricType}`] = {
        label: urlName,
        color: color
      }
    })
    
    return config
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      // Get monitored URLs with their latest analysis (only those that should show on dashboard)
      // Order by display_order to match the URLs page order (top-to-bottom → left-to-right)
      let urls, urlsError
      try {
        // Try ordering by display_order first
        const result = await supabase
          .from('urls')
          .select(`
            *,
            analysis_results(
              created_at,
              performance_score,
              fcp_time,
              lcp_time,
              unused_code_size
            )
          `)
          .eq('show_on_dashboard', true)
          .order('display_order', { ascending: true })
        
        urls = result.data
        urlsError = result.error
      } catch (error) {
        // Fallback to created_at if display_order column doesn't exist
        console.log('Falling back to created_at ordering:', error.message)
        const result = await supabase
          .from('urls')
          .select(`
            *,
            analysis_results(
              created_at,
              performance_score,
              fcp_time,
              lcp_time,
              unused_code_size
            )
          `)
          .eq('show_on_dashboard', true)
          .order('created_at', { ascending: true })
        
        urls = result.data
        urlsError = result.error
      }
      
      if (urlsError) throw urlsError

      // Process URLs to get latest analysis for each
      const processedUrls = urls?.map(url => {
        const latestAnalysis = url.analysis_results
          ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        return {
          ...url,
          latestAnalysis
        }
      }) || []

      // Get analyses and quick tests with simpler queries to avoid timeout
      let analysesData = []
      let quickTestsData = []
      
      try {
        // Get analyses without JOIN to avoid timeout
        const { data: basicAnalyses, error: analysesError } = await supabase
          .from('analysis_results')
          .select('id, url_id, performance_score, fcp_time, lcp_time, created_at')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false })
          .limit(15)
        
        if (analysesError) {
          console.error('Error fetching analyses:', analysesError)
        } else {
          analysesData = basicAnalyses || []
          console.log('Dashboard: Fetched analyses data:', analysesData.length)
        }
      } catch (error) {
        console.error('Analysis fetch failed:', error)
        analysesData = []
      }

      // Get URLs separately to match with analyses
      let urlsMap = {}
      if (analysesData.length > 0) {
        try {
          const urlIds = [...new Set(analysesData.map(a => a.url_id).filter(Boolean))]
          const { data: urlsData, error: urlsError } = await supabase
            .from('urls')
            .select('id, url')
            .in('id', urlIds)
          
          if (!urlsError && urlsData) {
            urlsMap = Object.fromEntries(urlsData.map(u => [u.id, u.url]))
            console.log('Dashboard: Fetched URLs map:', Object.keys(urlsMap).length)
            console.log('Dashboard: URLs data:', urlsData)
            console.log('Dashboard: urlsMap:', urlsMap)
          } else {
            console.log('Dashboard: URLs fetch error:', urlsError)
          }
        } catch (error) {
          console.error('URLs fetch failed:', error)
        }
      }

      try {
        // Get quick tests
        const { data: basicQuickTests, error: quickTestsError } = await supabase
          .from('quick_tests')
          .select('id, url, performance_score, fcp_time, lcp_time, created_at')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false })
          .limit(15)
        
        if (quickTestsError) {
          console.error('Error fetching quick tests:', quickTestsError)
        } else {
          quickTestsData = basicQuickTests || []
          console.log('Dashboard: Fetched quick tests data:', quickTestsData.length)
        }
      } catch (error) {
        console.error('Quick tests fetch failed:', error)
        quickTestsData = []
      }

      // Combine analyses and quick tests for history table
      const combinedAnalyses = [
        ...(analysesData || []).map(a => ({ 
          ...a, 
          type: 'monitored', 
          url_name: 'Monitored Page',
          display_url: urlsMap[a.url_id] || 'Unknown URL'
        })),
        ...(quickTestsData || []).map(q => ({ 
          ...q, 
          type: 'quick_test', 
          url_name: 'Quick Test',
          display_url: q.url
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      console.log('Dashboard: Combined analyses:', combinedAnalyses.length)
      console.log('Dashboard: Sample analysis:', combinedAnalyses[0])
      console.log('Dashboard: All analyses display_url:', combinedAnalyses.map(a => ({ type: a.type, display_url: a.display_url, url_id: a.url_id })))

      // Get historical data for charts using selected time range
      const { data: chartAnalyses, error: chartError } = await supabase
        .from('analysis_results')
        .select(`
          created_at,
          fcp_time,
          lcp_time,
          performance_score,
          urls!inner(id, name, url, show_on_dashboard)
        `)
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('urls.show_on_dashboard', true)
        .order('created_at', { ascending: true })
      
      if (chartError) console.warn('Error loading chart data:', chartError)

      // Process chart data
      const processedChartData = processChartData(chartAnalyses || [])

      // Batch state updates to reduce re-renders
      setMonitoredUrls(processedUrls)
      setAllAnalyses(combinedAnalyses)
      setChartData(processedChartData)
      setLoading(false) // Set loading false here to prevent re-render during AI generation

      // Generate AI insights when data is loaded (only if we have sites with data)
      if (processedUrls.length > 0) {
        // Add delay to avoid rate limiting on dashboard load
        setTimeout(() => {
          generateAIInsight(processedUrls)
        }, 2000) // 2 second delay
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false) // Also set loading false in error case
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/luna.svg" alt="Luna" className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Performance overview and monitoring insights
            </p>
          </div>
          <div className="flex-shrink-0">
            <TimeRangeSelector 
              value={timeRange} 
              onValueChange={setTimeRange}
            />
          </div>
        </div>

        {/* AI Performance Insights */}
        <AIInsights 
          cachedInsight={cachedInsight}
          loading={loading}
        />

        {/* Monitored Websites Cards */}
        {monitoredUrls.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {monitoredUrls.map((url) => (
                <Card key={url.id} className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{url.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {url.latestAnalysis ? (
                      <>
                        {/* Performance Score - Speedometer */}
                        <div className="text-center py-2 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Performance Score</div>
                          <SpeedometerChart 
                            key={`speedometer-${url.id}-${url.latestAnalysis.performance_score}`}
                            score={url.latestAnalysis.performance_score} 
                            analysisDate={url.latestAnalysis.created_at}
                          />
                        </div>
                        
                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-lg flex-1">
                          <div className="space-y-1">
                            <div className="text-muted-foreground text-sm flex items-center gap-1">
                              FCP
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Info className="h-3 w-3 cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">First Contentful Paint (FCP)</h4>
                                    <p className="text-sm text-muted-foreground">
                                      FCP measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.
                                    </p>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                            <ColoredBadge variant="ghost" color={getFCPColor(url.latestAnalysis.fcp_time)}>
                              {formatTime(url.latestAnalysis.fcp_time)}
                            </ColoredBadge>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground text-sm flex items-center gap-1">
                              LCP
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Info className="h-3 w-3 cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Largest Contentful Paint (LCP)</h4>
                                    <p className="text-sm text-muted-foreground">
                                      LCP measures the time from when the page starts loading to when the largest text block or image element is rendered on the screen.
                                    </p>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                            <ColoredBadge variant="ghost" color={getLCPColor(url.latestAnalysis.lcp_time)}>
                              {formatTime(url.latestAnalysis.lcp_time)}
                            </ColoredBadge>
                          </div>
                        </div>
                        
                        {/* View Details Button */}
                        <Button variant="outline" asChild className="w-full mt-auto">
                          <Link to={`/urls/${url.id}/results`}>
                            View Details
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center py-8 bg-muted/50 rounded-lg flex-1 flex items-center justify-center">
                          <div className="text-sm text-muted-foreground">No Analysis Yet</div>
                        </div>
                        <Button asChild className="w-full mt-auto">
                          <Link to={`/urls/${url.id}/results`}>
                            Run First Analysis
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Performance Charts */}
        {chartData.data && chartData.data.length > 0 && chartData.urlNames && chartData.urlNames.length > 0 && (
          <div className="mb-12 space-y-8">
            {/* Performance Score Chart - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Performance Score
                </CardTitle>
                <CardDescription>
                  Showing performance scores for all monitored pages over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer 
                  config={getChartConfig(chartData.urlNames, 'performance')} 
                  className="h-[400px] w-full"
                >
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                    />
                    {/* Performance Score Threshold Lines */}
                    <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                                          {chartData.urlNames?.map((urlName, index) => {
                        const config = getChartConfig(chartData.urlNames, 'performance')
                        const lineConfig = config[`${urlName}_performance`]
                        return (
                          <Line
                            key={urlName}
                            type="monotone"
                            dataKey={`${urlName}_performance`}
                            stroke={lineConfig?.color}
                            strokeWidth={3}
                            connectNulls={false}
                            dot={{ fill: lineConfig?.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: lineConfig?.color, stroke: '#fff', strokeWidth: 2 }}
                          />
                        )
                      })}
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* LCP and FCP Charts Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LCP Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Largest Contentful Paint (LCP)
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Largest Contentful Paint (LCP)</h4>
                          <p className="text-sm text-muted-foreground">
                            LCP measures the time from when the page starts loading to when the largest text block or image element is rendered on the screen.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CardTitle>
                  <CardDescription>
                    LCP performance for all monitored pages over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer 
                    config={getChartConfig(chartData.urlNames, 'lcp')} 
                    className="h-[350px] w-full"
                  >
                                        <LineChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                      />
                      {/* LCP Threshold Lines */}
                      <ReferenceLine y={2500} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.6} />
                      <ReferenceLine y={4000} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                                              {chartData.urlNames?.map((urlName, index) => {
                          const config = getChartConfig(chartData.urlNames, 'lcp')
                          const lineConfig = config[`${urlName}_lcp`]
                          return (
                            <Line
                              key={urlName}
                              type="monotone"
                              dataKey={`${urlName}_lcp`}
                              stroke={lineConfig?.color}
                              strokeWidth={3}
                              connectNulls={false}
                              dot={{ fill: lineConfig?.color, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: lineConfig?.color, stroke: '#fff', strokeWidth: 2 }}
                            />
                          )
                        })}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* FCP Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    First Contentful Paint (FCP)
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">First Contentful Paint (FCP)</h4>
                          <p className="text-sm text-muted-foreground">
                            FCP measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CardTitle>
                  <CardDescription>
                    FCP performance for all monitored pages over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer 
                    config={getChartConfig(chartData.urlNames, 'fcp')} 
                    className="h-[350px] w-full"
                  >
                                        <LineChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                      />
                      {/* FCP Threshold Lines */}
                      <ReferenceLine y={1800} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.6} />
                      <ReferenceLine y={3000} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                                              {chartData.urlNames?.map((urlName, index) => {
                          const config = getChartConfig(chartData.urlNames, 'fcp')
                          const lineConfig = config[`${urlName}_fcp`]
                          return (
                            <Line
                              key={urlName}
                              type="monotone"
                              dataKey={`${urlName}_fcp`}
                              stroke={lineConfig?.color}
                              strokeWidth={3}
                              connectNulls={false}
                              dot={{ fill: lineConfig?.color, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: lineConfig?.color, stroke: '#fff', strokeWidth: 2 }}
                            />
                          )
                        })}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}


        {/* Recent Test History - Always Show if Any Analyses Exist */}
        {allAnalyses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Recent Test History</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-20">Type</TableHead>
                        <TableHead className="min-w-48">Website</TableHead>
                        <TableHead className="min-w-24">Performance</TableHead>
                        <TableHead className="min-w-20">FCP</TableHead>
                        <TableHead className="min-w-20">LCP</TableHead>
                        <TableHead className="min-w-24">Date</TableHead>
                        <TableHead className="min-w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {allAnalyses.slice(0, 10).map((analysis) => (
                      <TableRow key={`${analysis.type}-${analysis.id}`}>
                        <TableCell>
                          <Badge variant={analysis.type === 'monitored' ? 'outline' : 'secondary'}>
                            {analysis.type === 'monitored' ? 'Monitored' : 'Quick Test'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-base">
                          {analysis.type === 'quick_test' 
                            ? cleanUrl(analysis.display_url) 
                            : cleanUrl(analysis.display_url) || 'Loading...'
                          }
                        </TableCell>
                        <TableCell>
                          <ColoredBadge variant="ghost" color={getPerformanceColor(analysis.performance_score)}>
                            <span className="text-base">
                              {analysis.performance_score ? (
                                <NumberFlow 
                                  value={analysis.performance_score} 
                                  format={{ maximumFractionDigits: 0 }}
                                  suffix="/100"
                                  willChange
                                />
                              ) : (
                                'N/A'
                              )}
                            </span>
                          </ColoredBadge>
                        </TableCell>
                        <TableCell>
                          <ColoredBadge variant="ghost" color={getFCPColor(analysis.fcp_time)}>
                            <span className="text-base">
                              <AnimatedTime time={analysis.fcp_time} />
                            </span>
                          </ColoredBadge>
                        </TableCell>
                        <TableCell>
                          <ColoredBadge variant="ghost" color={getLCPColor(analysis.lcp_time)}>
                            <span className="text-base">
                              <AnimatedTime time={analysis.lcp_time} />
                            </span>
                          </ColoredBadge>
                        </TableCell>
                        <TableCell>
                          {new Date(analysis.created_at).toLocaleDateString()}<br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {analysis.type === 'monitored' ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/urls/${analysis.url_id}/results`}>
                                View
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/quick-testing/${analysis.id}/results`}>
                                View
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Cards - Show when no dashboard URLs */}
        {monitoredUrls.length === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                  <LinkIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2 text-lg sm:text-xl">Monitored Pages</CardTitle>
                  <CardDescription className="mb-4">
                    Add websites for continuous monitoring and automatic daily analysis.
                  </CardDescription>
                  <Button asChild className="w-full">
                    <Link to="/urls">
                      View Monitored Pages
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                  <Zap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2 text-lg sm:text-xl">Quick Testing</CardTitle>
                  <CardDescription className="mb-4">
                    Run one-time performance analysis on any website instantly.
                  </CardDescription>
                  <Button asChild className="w-full">
                    <Link to="/quick-testing">
                      Start Quick Test
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State - Only for completely new users */}
        {monitoredUrls.length === 0 && allAnalyses.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">Welcome to Luna Analytics!</CardTitle>
              <CardDescription className="mb-6">
                Start by adding a website to monitor or run a quick test.
              </CardDescription>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  )
}
