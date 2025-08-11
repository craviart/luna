import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Target, 
  FileText, 
  LinkIcon,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Loader2,
  FileCode,
  Edit2,
  Trash2
} from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { AnalysisDataTable } from '../components/AnalysisDataTable'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from '../components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase-simple'
import { toast } from 'sonner'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

// Google PageSpeed Insights color coding for Core Web Vitals
// Clean URL display function - remove protocol and www for cooler look
const cleanUrl = (url) => {
  if (!url) return url
  
  return url
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/^www\./, '')       // Remove www.
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

const getPerformanceColor = (score) => {
  if (!score) return 'hsl(var(--muted-foreground))'
  if (score >= 90) return 'hsl(142, 76%, 36%)'  // green
  if (score >= 50) return 'hsl(45, 93%, 47%)'   // amber
  return 'hsl(0, 84%, 60%)'                     // red
}

const getTBTColor = (tbt) => {
  if (!tbt) return 'hsl(var(--muted-foreground))'
  if (tbt <= 200) return 'hsl(142, 76%, 36%)'   // green
  if (tbt <= 600) return 'hsl(45, 93%, 47%)'    // amber
  return 'hsl(0, 84%, 60%)'                     // red
}

const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${(time / 1000).toFixed(2)}s`
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

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}



export default function URLDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [url, setUrl] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
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
    loadUrlAndAnalyses()
  }, [id, timeRange])

  const handleAnalyze = async () => {
    if (!url) return
    
    setIsAnalyzing(true)
    setProgress(0)
    setProgressMessage('Initializing analysis...')
    
    try {
      // Optimized progress steps - faster and more accurate
      const progressSteps = [
        { progress: 8, message: 'Connecting to PageSpeed Insights API...', delay: 300 },
        { progress: 15, message: 'Requesting performance audit...', delay: 400 },
        { progress: 25, message: 'Loading page with mobile 4G simulation...', delay: 500 },
        { progress: 35, message: 'Capturing First Contentful Paint (FCP)...', delay: 400 },
        { progress: 45, message: 'Measuring Largest Contentful Paint (LCP)...', delay: 400 },
        { progress: 55, message: 'Analyzing Speed Index metrics...', delay: 300 },
        { progress: 65, message: 'Evaluating Total Blocking Time (TBT)...', delay: 300 },
        { progress: 75, message: 'Calculating Cumulative Layout Shift (CLS)...', delay: 300 },
        { progress: 85, message: 'Generating performance score...', delay: 200 },
        { progress: 95, message: 'Saving results...', delay: 200 }
      ]

      // Execute progress steps
      for (const step of progressSteps) {
        setProgress(step.progress)
        setProgressMessage(step.message)
        await new Promise(resolve => setTimeout(resolve, step.delay))
      }
      
      // Make the actual API call (using PageSpeed-only for reliability)
      const response = await fetch('/api/analyze-pagespeed-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.url,
          urlId: url.id
        }),
      })

      const result = await response.json()
      
      setProgress(99)
      setProgressMessage('Analysis complete!')
      await new Promise(resolve => setTimeout(resolve, 200))

      if (result.success) {
        // The API already saves to database, so we just need to reload
        setProgress(100)
        setProgressMessage('Analysis complete!')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        toast.success('Analysis completed successfully!', {
          description: 'New performance data has been recorded'
        })
        
        // Reload the analyses to show the new data
        await loadUrlAndAnalyses()
      } else {
        throw new Error(result.message || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Analysis failed: ' + error.message)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
      setProgressMessage('')
    }
  }

  const handleEditTitle = () => {
    setNewTitle(url.name || '')
    setIsEditingTitle(true)
  }

  const handleSaveTitle = async () => {
    try {
      const { error } = await supabase
        .from('urls')
        .update({ name: newTitle })
        .eq('id', id)

      if (error) throw error

      setUrl({ ...url, name: newTitle })
      setIsEditingTitle(false)
      toast.success('Title updated successfully!')
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    }
  }

  const handleDashboardVisibilityChange = async (checked) => {
    try {
      const { error } = await supabase
        .from('urls')
        .update({ show_on_dashboard: checked })
        .eq('id', id)

      if (error) throw error

      setUrl({ ...url, show_on_dashboard: checked })
      toast.success(checked ? 'Added to dashboard' : 'Removed from dashboard')
    } catch (error) {
      console.error('Error updating dashboard visibility:', error)
      toast.error('Failed to update dashboard visibility')
    }
  }

  const handleDeleteUrl = async () => {
    try {
      // First delete all related analyses
      const { error: analysesError } = await supabase
        .from('analysis_results')
        .delete()
        .eq('url_id', id)

      if (analysesError) throw analysesError

      // Then delete the URL
      const { error: urlError } = await supabase
        .from('urls')
        .delete()
        .eq('id', id)

      if (urlError) throw urlError

      toast.success('Monitored page deleted successfully')
      navigate('/urls')
    } catch (error) {
      console.error('Error deleting URL:', error)
      toast.error('Failed to delete monitored page')
    }
  }

  const loadUrlAndAnalyses = async () => {
    try {
      // Get URL details
      const { data: urlData, error: urlError } = await supabase
        .from('urls')
        .select('*')
        .eq('id', id)
        .single()

      // Get analyses for this URL with time range filtering
      const { start, end } = getDateRange()
      const { data: analysesData, error: analysesError } = await supabase
        .from('analysis_results')
        .select('id, created_at, success, fcp_time, lcp_time, performance_score, url_id, load_time, status, title, speed_index, total_blocking_time, cumulative_layout_shift')
        .eq('url_id', id)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })

      if (!urlError && !analysesError) {
        setUrl(urlData)
        setAnalyses(analysesData || [])
        
        // Prepare chart data for performance evolution
        const successfulAnalyses = (analysesData || []).filter(a => a.success)
        const chartDataPoints = successfulAnalyses
          .slice(0, 30) // Last 30 analyses
          .reverse() // Chronological order
          .map((analysis, index) => {
            const date = new Date(analysis.created_at)
            return {
              date: date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              fcp_time: analysis.fcp_time || null,
              lcp_time: analysis.lcp_time || null,
              performance_score: analysis.performance_score || null,
              created_at: analysis.created_at,
              full_date: date.toISOString() // Keep for debugging
            }
          })
          .filter(point => 
            point.fcp_time !== null || 
            point.lcp_time !== null || 
            point.performance_score !== null
          ) // Only include points with actual data
        
        console.log('Chart data prepared:', chartDataPoints)
        console.log('Chart data length:', chartDataPoints.length)
        setChartData(chartDataPoints)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ title, value, trend, isNumber = false, rawValue = null }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isNumber && rawValue !== null ? (
            <NumberFlow 
              value={rawValue} 
              format={{ maximumFractionDigits: 0 }}
              willChange
            />
          ) : (
            value
          )}
        </div>
        {trend !== undefined && (
          <div className="flex items-center pt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground mr-1" />
            )}
            <span className={`text-xs ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              <NumberFlow 
                value={Math.abs(trend)} 
                format={{ maximumFractionDigits: 1 }}
                suffix="% from last analysis"
                willChange
              />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const AnalysisCard = ({ analysis, isLatest = false }) => (
    <Card className={isLatest ? "border-primary" : ""}>
      {isLatest && (
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <span className="text-sm font-medium text-primary">Latest Analysis</span>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={isLatest ? "pt-2" : "pt-6"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              analysis.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}>
              {analysis.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {analysis.success ? 'Analysis Completed' : 'Analysis Failed'}
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(analysis.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Load Time</p>
            <p className="font-semibold">{formatTime(analysis.load_time)}</p>
          </div>
        </div>

        {analysis.success && (
          <>


            {/* Coverage Data Section */}
            {analysis.coverage_data && analysis.coverage_data.length > 0 && (
              <div className="border-t border-border pt-4 mb-4">
                <h4 className="font-medium text-sm mb-3">Chrome Coverage Analysis - Top Files with Unused Code</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-medium">File</th>
                        <th className="text-left py-2 pr-3 font-medium">Type</th>
                        <th className="text-right py-2 pr-3 font-medium">Size</th>
                        <th className="text-right py-2 pr-3 font-medium">Unused</th>
                        <th className="text-right py-2 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.coverage_data.slice(0, 5).map((file, index) => (
                        <tr key={file.url} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 pr-3">
                            <p className="font-mono text-xs truncate max-w-[120px]" title={file.url}>
                              {file.url}
                            </p>
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              file.type === 'CSS' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {file.type}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {(file.totalBytes / 1024).toFixed(1)}KB
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs text-red-600 dark:text-red-400">
                            {(file.unusedBytes / 1024).toFixed(1)}KB
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <div className="w-8 bg-secondary rounded-full h-1">
                                <div 
                                  className="bg-red-500 h-1 rounded-full" 
                                  style={{ width: `${Math.min(100, file.unusedPercentage)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-red-600 dark:text-red-400 w-8 text-right">
                                {file.unusedPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analysis.coverage_data.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing top 5 of {analysis.coverage_data.length} files with unused code
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Title</p>
                  <p className="break-words">{analysis.title || 'No title found'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Status</p>
                  <p className={`font-medium ${analysis.status === 200 ? 'text-green-500' : 'text-red-500'}`}>
                    {analysis.status || 'Unknown'}
                  </p>
                </div>
                {analysis.description && (
                  <div className="md:col-span-2">
                    <p className="font-medium text-muted-foreground mb-1">Description</p>
                    <p className="break-words">{analysis.description}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!analysis.success && analysis.error_message && (
          <div className="border-t border-border pt-4">
            <p className="font-medium text-destructive mb-1">Error</p>
            <p className="text-sm text-muted-foreground">{analysis.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-2xl mb-2">URL Not Found</CardTitle>
              <CardDescription className="text-center mb-6">
                The URL you're looking for doesn't exist.
              </CardDescription>
              <Button asChild>
                <Link to="/urls">
                  Back to URLs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const latestAnalysis = analyses[0]
  const successfulAnalyses = analyses.filter(a => a.success)
  
  // Calculate percentage changes from previous analysis
  const calculatePercentageChange = (current, previous) => {
    if (!current || !previous || previous === 0) return null
    return ((current - previous) / previous) * 100
  }
  
  // Get trends for metrics (comparing latest vs second latest successful analysis)
  const getMetricTrends = () => {
    if (successfulAnalyses.length < 2) return {}
    
    const latest = successfulAnalyses[0]
    const previous = successfulAnalyses[1]
    
    return {
      // For performance score: higher is better, so positive change is good
      performanceScore: calculatePercentageChange(latest.performance_score, previous.performance_score),
      // For timing metrics: lower is better, so we invert the trend (negative change is good)
      fcpTime: calculatePercentageChange(latest.fcp_time, previous.fcp_time) * -1,
      lcpTime: calculatePercentageChange(latest.lcp_time, previous.lcp_time) * -1,
      tbtTime: calculatePercentageChange(latest.total_blocking_time, previous.total_blocking_time) * -1
    }
  }
  
  const trends = getMetricTrends()

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/urls">
                Back to URLs
              </Link>
            </Button>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {url.name || 'Website Analysis'}
                </h1>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <a 
                  href={url.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground hover:underline break-all flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {cleanUrl(url.url)}
                </a>
                <span>•</span>
                <span className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
                </span>
              </div>
              {url.description && (
                <p className="mt-2 text-muted-foreground">{url.description}</p>
              )}

              {/* Dashboard Visibility Switch */}
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="dashboard-visibility"
                  checked={url.show_on_dashboard ?? true}
                  onCheckedChange={handleDashboardVisibilityChange}
                />
                <Label htmlFor="dashboard-visibility" className="text-sm">
                  Show on dashboard
                </Label>
              </div>
            </div>
            <div className="mt-4 lg:mt-0">
              {/* Time Range Selector and Action Buttons */}
              <div className="flex items-center gap-4">
                <TimeRangeSelector 
                  value={timeRange} 
                  onValueChange={setTimeRange}
                />
                {/* Action Buttons - Delete, Edit, Run Analysis in same line */}
                <div className="flex items-center gap-2">
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this 
                        monitored page and all its analysis history from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteUrl}>
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" size="sm" onClick={handleEditTitle}>
                  Edit Title
                </Button>
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Run New Analysis'
                  )}
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Evolution Charts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Performance Evolution</h2>
          {chartData && chartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* First Contentful Paint Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    First Contentful Paint
                  </CardTitle>
                  <CardDescription>
                    Loading speed over time (lower is better)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer 
                    config={{
                      fcp_time: {
                        label: "FCP Time",
                        color: "hsl(0, 0%, 15%)",
                      }
                    }} 
                    className="h-[250px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 's', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => `Date: ${value}`}
                        formatter={(value) => [
                          value !== null ? `${(value / 1000).toFixed(2)}s` : 'No data', 
                          'FCP Time'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="fcp_time"
                        stroke="hsl(0, 0%, 15%)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Largest Contentful Paint Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Largest Contentful Paint
                  </CardTitle>
                  <CardDescription>
                    Main content loading time (lower is better)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer 
                    config={{
                      lcp_time: {
                        label: "LCP Time",
                        color: "hsl(0, 0%, 25%)",
                      }
                    }} 
                    className="h-[250px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 's', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => `Date: ${value}`}
                        formatter={(value) => [
                          value !== null ? `${(value / 1000).toFixed(2)}s` : 'No data', 
                          'LCP Time'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="lcp_time"
                        stroke="hsl(0, 0%, 25%)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Performance Score Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Performance Score
                  </CardTitle>
                  <CardDescription>
                    Core Web Vitals score (higher is better)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer 
                    config={{
                      performance_score: {
                        label: "Performance Score",
                        color: "hsl(0, 0%, 35%)",
                      }
                    }} 
                    className="h-[250px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        domain={[0, 100]}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => `Date: ${value}`}
                        formatter={(value) => [
                          value !== null ? `${value}/100` : 'No data', 
                          'Performance Score'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="performance_score"
                        stroke="hsl(0, 0%, 35%)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No performance data available yet. Run an analysis to see charts.
              </p>
            </div>
          )}
        </div>

        {/* Latest Analysis Overview */}
        {latestAnalysis && latestAnalysis.success && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Latest Analysis Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Performance Score"
                value={`${latestAnalysis.performance_score || 0}/100`}
                trend={trends.performanceScore}
                isNumber={true}
                rawValue={latestAnalysis.performance_score || 0}
              />
              <MetricCard
                title="First Contentful Paint"
                value={formatTime(latestAnalysis.fcp_time)}
                trend={trends.fcpTime}
              />
              <MetricCard
                title="Largest Contentful Paint"
                value={formatTime(latestAnalysis.lcp_time)}
                trend={trends.lcpTime}
              />
              <MetricCard
                title="Total Blocking Time"
                value={formatTime(latestAnalysis.total_blocking_time)}
                trend={trends.tbtTime}
              />
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Analysis History</h2>
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No analyses yet</CardTitle>
                <CardDescription className="text-center mb-6">
                  Run your first analysis to see detailed insights.
                </CardDescription>
                <Button asChild>
                  <Link to="/urls">
                    Go Back and Analyze
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnalysisDataTable data={analyses} />
          )}
        </div>



        {/* Performance Insights */}
        {successfulAnalyses.length > 1 && (
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Performance Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-lg font-semibold opacity-90 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Average Load Time
                  </p>
                  <p className="text-3xl font-bold">
                    <NumberFlow 
                      value={(successfulAnalyses.reduce((sum, a) => sum + a.load_time, 0) / successfulAnalyses.length) / 1000}
                      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                      suffix="s"
                      willChange
                    />
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold opacity-90 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Success Rate
                  </p>
                  <p className="text-3xl font-bold">
                    <NumberFlow 
                      value={Math.round((analyses.filter(a => a.success).length / analyses.length) * 100)}
                      format={{ maximumFractionDigits: 0 }}
                      suffix="%"
                      willChange
                    />
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold opacity-90 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Total Analyses
                  </p>
                  <p className="text-3xl font-bold">
                    <NumberFlow 
                      value={analyses.length}
                      format={{ maximumFractionDigits: 0 }}
                      willChange
                    />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

                {/* Analysis Progress Dialog */}
        <AlertDialog open={isAnalyzing}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">
                Running Analysis
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Analyzing performance metrics for this monitored page
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-6 text-center">
              {/* Large animated percentage display */}
              <div>
                <div className="text-6xl font-bold text-primary mb-3">
                  <NumberFlow 
                    value={progress}
                    format={{ maximumFractionDigits: 0, minimumIntegerDigits: 1 }}
                    suffix="%"
                    willChange
                  />
                </div>
                <div className="text-sm text-muted-foreground">{progressMessage}</div>
              </div>
              
              {/* Progress bar */}
              <Progress value={progress} className="w-full h-3" />
              
              <p className="text-xs text-muted-foreground">
                This may take up to 60 seconds
              </p>
              
              {/* Cancel button */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAnalyzing(false)
                  setProgress(0)
                  setProgressMessage('')
                }}
                className="mt-4"
              >
                Cancel Analysis
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Title Dialog */}
        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Page Title</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingTitle(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTitle}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

