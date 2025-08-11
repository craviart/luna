import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { TestTube, Zap, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase-simple'
import { toast } from 'sonner'
import NumberFlow from '@number-flow/react'

export default function QuickTesting() {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [quickTests, setQuickTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingTestId, setDeletingTestId] = useState(null)

  // Utility functions
  const formatTime = (time) => {
    if (!time) return 'N/A'
    return `${(time / 1000).toFixed(2)}s`
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

  useEffect(() => {
    loadQuickTests()
  }, [])

  const loadQuickTests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quick_tests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setQuickTests(data || [])
    } catch (error) {
      console.error('Error loading quick tests:', error)
      toast.error('Failed to load test results')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced URL validation function with flexible input handling
  const validateUrl = (urlString) => {
    if (!urlString || !urlString.trim()) {
      return { isValid: false, error: 'Please enter a URL' }
    }

    let trimmedUrl = urlString.trim()

    // Auto-add protocol if missing
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      // Add https:// by default for better security
      trimmedUrl = `https://${trimmedUrl}`
    }

    // Handle common URL variations
    // Remove any double slashes after protocol
    trimmedUrl = trimmedUrl.replace(/([^:]\/)\/+/g, '$1')
    
    // Handle www. variations
    if (trimmedUrl.includes('://www') && !trimmedUrl.includes('://www.')) {
      trimmedUrl = trimmedUrl.replace('://www', '://www.')
    }

    try {
      const url = new URL(trimmedUrl)
      
      // Check for valid domain
      if (!url.hostname || url.hostname.length < 3) {
        return { isValid: false, error: 'Please enter a valid domain name' }
      }

      // Check for at least one dot in hostname (basic domain validation)
      if (!url.hostname.includes('.')) {
        return { isValid: false, error: 'Please enter a valid domain (e.g., example.com)' }
      }

      // Check for invalid characters in hostname
      const validHostnameRegex = /^[a-zA-Z0-9.-]+$/
      if (!validHostnameRegex.test(url.hostname)) {
        return { isValid: false, error: 'Domain contains invalid characters' }
      }

      // Check for common localhost/private IPs that won't work
      const invalidHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
      if (invalidHosts.includes(url.hostname)) {
        return { isValid: false, error: 'Local URLs cannot be analyzed. Please use a public website.' }
      }

      // Check for private IP ranges
      const privateIpRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/
      if (privateIpRegex.test(url.hostname)) {
        return { isValid: false, error: 'Private IP addresses cannot be analyzed. Please use a public website.' }
      }

      return { isValid: true, url: trimmedUrl }
    } catch (error) {
      return { isValid: false, error: 'Please enter a valid URL format (e.g., fast.com or https://example.com)' }
    }
  }

  // Handle URL input changes
  const handleUrlChange = (e) => {
    const value = e.target.value
    setUrl(value)
    
    // Clear error when user starts typing
    if (urlError) {
      setUrlError('')
    }
  }

  // Validate URL on blur
  const handleUrlBlur = () => {
    if (url.trim()) {
      const validation = validateUrl(url)
      if (!validation.isValid) {
        setUrlError(validation.error)
      } else {
        setUrlError('')
      }
    }
  }

  const handleAnalyze = async () => {
    // Validate URL before proceeding
    const validation = validateUrl(url)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    const validUrl = validation.url

    setIsAnalyzing(true)
    setProgress(0)
    setProgressMessage('Initializing analysis...')

    try {
      // Optimized progress steps - faster and more accurate  
      const progressSteps = [
        { progress: 5, message: 'Initializing quick test environment...', delay: 200 },
        { progress: 12, message: 'Connecting to PageSpeed Insights API...', delay: 300 },
        { progress: 20, message: 'Requesting performance audit...', delay: 400 },
        { progress: 30, message: 'Loading page with mobile 4G simulation...', delay: 500 },
        { progress: 40, message: 'Capturing First Contentful Paint (FCP)...', delay: 400 },
        { progress: 50, message: 'Measuring Largest Contentful Paint (LCP)...', delay: 400 },
        { progress: 60, message: 'Analyzing Speed Index metrics...', delay: 300 },
        { progress: 70, message: 'Evaluating Total Blocking Time (TBT)...', delay: 300 },
        { progress: 80, message: 'Calculating Cumulative Layout Shift (CLS)...', delay: 300 },
        { progress: 90, message: 'Generating performance score...', delay: 200 },
        { progress: 96, message: 'Saving test results...', delay: 200 }
      ]

      // Execute progress steps
      for (const step of progressSteps) {
        setProgress(step.progress)
        setProgressMessage(step.message)
        await new Promise(resolve => setTimeout(resolve, step.delay))
      }

      // Make the actual API call (unified with monitored URLs approach)
      const response = await fetch('/api/analyze-pagespeed-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: validUrl,
          isQuickTest: true 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      setProgress(96)
      setProgressMessage('Saving results to database...')
      await new Promise(resolve => setTimeout(resolve, 300))

      if (result.success && result.result) {
        // The API handles database saving, consistent with monitored URLs
        setProgress(100)
        setProgressMessage('Analysis complete!')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        toast.success('Analysis completed successfully!', {
          description: `Performance Score: ${result.result.performance_score || 'N/A'}/100`
        })
        
        // Reset form and reload tests to show the new data
        setUrl('')
        await loadQuickTests()
      } else {
        throw new Error(result.message || 'Analysis failed')
      }

    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
      setProgressMessage('')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  // Clean URL display function - remove protocol and www for cooler look
  const cleanUrl = (url) => {
    if (!url) return url
    
    return url
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/^www\./, '')       // Remove www.
  }

  // Delete quick test function
  const handleDeleteTest = async (testId) => {
    try {
      setDeletingTestId(testId)
      
      const { error } = await supabase
        .from('quick_tests')
        .delete()
        .eq('id', testId)
      
      if (error) throw error
      
      toast.success('Test deleted successfully')
      await loadQuickTests() // Reload the list
    } catch (error) {
      console.error('Error deleting test:', error)
      toast.error('Failed to delete test')
    } finally {
      setDeletingTestId(null)
    }
  }



  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
        </div>

        {/* Quick Test Form */}
        <Card className="mb-12">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Test Any URL
          </CardTitle>
          <CardDescription className="mt-2 text-lg text-muted-foreground">
            Run a one-time performance analysis on any website. Results include FCP, LCP, and Performance Score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && !urlError && url.trim() && handleAnalyze()}
              disabled={isAnalyzing}
              className={`h-12 text-lg ${urlError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {urlError && (
              <p className="text-sm text-red-600 mt-1">{urlError}</p>
            )}
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !url.trim() || !!urlError}
              className="w-full h-12 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Test'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Previous Tests */}
                <Card>
          <CardHeader>
            <CardTitle>Previous Tests</CardTitle>
          <CardDescription>
            View your recent quick test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading tests...</span>
            </div>
          ) : quickTests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quick tests yet</p>
              <p className="text-sm">Run your first test above to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>FCP</TableHead>
                    <TableHead>LCP</TableHead>

                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quickTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{cleanUrl(test.url)}</div>
                      </TableCell>
                      <TableCell>
                        <ColoredBadge color={getPerformanceColor(test.performance_score)}>
                          <NumberFlow 
                            value={test.performance_score || 0} 
                            format={{ maximumFractionDigits: 0 }}
                            suffix="/100"
                            willChange
                          />
                        </ColoredBadge>
                      </TableCell>
                      <TableCell>
                        <ColoredBadge color={getFCPColor(test.fcp_time)}>
                          {formatTime(test.fcp_time)}
                        </ColoredBadge>
                      </TableCell>
                      <TableCell>
                        <ColoredBadge color={getLCPColor(test.lcp_time)}>
                          {formatTime(test.lcp_time)}
                        </ColoredBadge>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(test.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/quick-testing/${test.id}/results`}>
                              See Results
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingTestId === test.id}
                              >
                                {deletingTestId === test.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this quick test? This action cannot be undone.
                                  <div className="mt-2 text-sm font-medium">
                                    URL: {cleanUrl(test.url)}
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTest(test.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Progress Dialog */}
      <AlertDialog open={isAnalyzing}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Running Quick Test
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Analyzing your website's performance metrics
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
              Cancel Test
            </Button>
          </div>
        </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}