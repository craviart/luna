import React, { useState, useEffect } from 'react'
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
  TrendingUp
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
} from '@/components/ui/chart'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import { supabase } from '../lib/supabase-simple'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

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
  const ColoredBadge = ({ value, color, children }) => (
    <Badge variant="outline" className="flex items-center gap-1">
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

  // Speedometer Component using shadcn Radial Chart
  const SpeedometerChart = ({ score }) => {
    const [animatedScore, setAnimatedScore] = useState(0)
    const actualScore = score || 0
    
    // Animate from 0 to actual score on mount/change
    useEffect(() => {
      setAnimatedScore(0) // Reset to 0 first
      const timer = setTimeout(() => {
        setAnimatedScore(actualScore)
      }, 200)
      return () => clearTimeout(timer)
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
        <div className="relative -mt-40 flex flex-col items-center justify-center space-y-2">
          <div className="text-center">
            <div className="text-4xl font-bold">
              <NumberFlow 
                value={animatedScore} 
                format={{ maximumFractionDigits: 0 }}
                willChange
              />
            </div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
        </div>
      </div>
    )
  }



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

  // Chart configurations for different metrics using improved mono theme
  const getChartConfig = (urlNames, metricType) => {
    const config = {}
    // Improved mono theme: better contrast while maintaining professional look
    const monoColors = [
      'hsl(0, 0%, 15%)',    // Very dark gray - high contrast
      'hsl(0, 0%, 35%)',    // Dark gray
      'hsl(0, 0%, 55%)',    // Medium gray  
      'hsl(0, 0%, 75%)',    // Light gray
      'hsl(0, 0%, 90%)',    // Very light gray
      'hsl(0, 0%, 25%)',    // Additional dark shade
      'hsl(0, 0%, 45%)',    // Additional medium shade
      'hsl(0, 0%, 65%)'     // Additional light shade
    ]
    
    urlNames.forEach((urlName, index) => {
      const color = monoColors[index % monoColors.length]
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

      setMonitoredUrls(processedUrls)
      setAllAnalyses(combinedAnalyses)
      setChartData(processedChartData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Performance overview and monitoring insights
            </p>
          </div>
          <TimeRangeSelector 
            value={timeRange} 
            onValueChange={setTimeRange}
          />
        </div>

        {/* Monitored Websites Cards */}
        {monitoredUrls.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <div className="text-sm text-muted-foreground mb-2">Performance Score</div>
                          <SpeedometerChart score={url.latestAnalysis.performance_score} />
                        </div>
                        
                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                          <div className="space-y-1">
                            <div className="text-muted-foreground">FCP</div>
                            <ColoredBadge color={getFCPColor(url.latestAnalysis.fcp_time)}>
                              {formatTime(url.latestAnalysis.fcp_time)}
                            </ColoredBadge>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground">LCP</div>
                            <ColoredBadge color={getLCPColor(url.latestAnalysis.lcp_time)}>
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
                    <ChartTooltip content={<ChartTooltipContent />} />
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
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
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
                  <CardTitle>
                    Largest Contentful Paint (LCP)
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
                      <ChartTooltip content={<ChartTooltipContent />} />
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
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls={false}
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
                  <CardTitle>
                    First Contentful Paint (FCP)
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
                      <ChartTooltip content={<ChartTooltipContent />} />
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
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls={false}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>FCP</TableHead>
                      <TableHead>LCP</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAnalyses.slice(0, 10).map((analysis) => (
                      <TableRow key={`${analysis.type}-${analysis.id}`}>
                        <TableCell>
                          <Badge variant={analysis.type === 'monitored' ? 'default' : 'secondary'}>
                            {analysis.type === 'monitored' ? 'Monitored' : 'Quick Test'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {analysis.type === 'quick_test' 
                            ? cleanUrl(analysis.display_url) 
                            : cleanUrl(analysis.display_url) || 'Loading...'
                          }
                        </TableCell>
                        <TableCell>
                          <ColoredBadge color={getPerformanceColor(analysis.performance_score)}>
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
                          </ColoredBadge>
                        </TableCell>
                        <TableCell>
                          <ColoredBadge color={getFCPColor(analysis.fcp_time)}>
                            <AnimatedTime time={analysis.fcp_time} />
                          </ColoredBadge>
                        </TableCell>
                        <TableCell>
                          <ColoredBadge color={getLCPColor(analysis.lcp_time)}>
                            <AnimatedTime time={analysis.lcp_time} />
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Cards - Show when no dashboard URLs */}
        {monitoredUrls.length === 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Monitored Pages</CardTitle>
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
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Quick Testing</CardTitle>
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
