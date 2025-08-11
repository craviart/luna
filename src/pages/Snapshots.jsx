import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { supabase } from '../lib/supabase-simple'
import { Camera, Calendar, Clock, Download, Eye, RefreshCw, Zap } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { mockCaptureScreenshot, isDevelopment } from '../lib/screenshot-mock'

// Clean URL utility function
const cleanUrl = (url) => {
  if (!url) return url
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    let cleanedUrl = urlObj.hostname + urlObj.pathname
    if (urlObj.pathname === '/') {
      cleanedUrl = urlObj.hostname
    }
    return cleanedUrl.replace(/\/$/, '')
  } catch (error) {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  }
}

function Snapshots() {
  const [urls, setUrls] = useState([])
  const [screenshots, setScreenshots] = useState({})
  const [loading, setLoading] = useState(true)
  const [capturingAll, setCapturingAll] = useState(false)
  const [capturingProgress, setCapturingProgress] = useState(0)
  const [capturingMessage, setCapturingMessage] = useState('')
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [testUrl, setTestUrl] = useState('')
  const [capturingTest, setCapturingTest] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testMessage, setTestMessage] = useState('')

  // Fetch monitored URLs
  useEffect(() => {
    fetchUrls()
    fetchScreenshots()
  }, [])

  const fetchUrls = async () => {
    try {
      const { data: urlsData, error } = await supabase
        .from('urls')
        .select('*')
        .order('dashboard_order', { ascending: true })

      if (error) throw error
      setUrls(urlsData || [])
    } catch (error) {
      console.error('Error fetching URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScreenshots = async () => {
    try {
      const { data: screenshotsData, error } = await supabase
        .from('website_screenshots')
        .select('*')
        .order('captured_at', { ascending: false })

      if (error) throw error
      
      // Group screenshots by URL ID
      const groupedScreenshots = {}
      screenshotsData?.forEach(screenshot => {
        if (!groupedScreenshots[screenshot.url_id]) {
          groupedScreenshots[screenshot.url_id] = []
        }
        groupedScreenshots[screenshot.url_id].push(screenshot)
      })
      
      setScreenshots(groupedScreenshots)
    } catch (error) {
      console.error('Error fetching screenshots:', error)
    }
  }

  const captureScreenshot = async (urlId, url) => {
    try {
      let result
      if (isDevelopment()) {
        console.log('🧪 Using mock screenshot API for local development')
        result = await mockCaptureScreenshot(url, urlId)
      } else {
        const response = await fetch('/api/capture-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, urlId })
        })
        result = await response.json()
      }

      if (result.success) {
        await fetchScreenshots() // Refresh screenshots
        return true
      } else {
        console.error('Screenshot capture failed:', result.error)
        return false
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      return false
    }
  }

  const captureAllScreenshots = async () => {
    setCapturingAll(true)
    setCapturingProgress(0)
    setCapturingMessage('Starting screenshot capture...')

    const totalUrls = urls.length
    let completed = 0

    for (const url of urls) {
      setCapturingMessage(`Capturing ${cleanUrl(url.url)}...`)
      await captureScreenshot(url.id, url.url)
      completed++
      setCapturingProgress((completed / totalUrls) * 100)
      
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setCapturingMessage('All screenshots captured!')
    setTimeout(() => {
      setCapturingAll(false)
      setCapturingProgress(0)
      setCapturingMessage('')
    }, 2000)
  }

  const getLatestScreenshot = (urlId) => {
    return screenshots[urlId]?.[0]
  }

  const getScreenshotCount = (urlId) => {
    return screenshots[urlId]?.length || 0
  }

  // Validate URL utility (from QuickTesting)
  const validateUrl = (urlString) => {
    if (!urlString || !urlString.trim()) {
      return { isValid: false, error: 'Please enter a URL' }
    }

    let trimmedUrl = urlString.trim()

    // Add https:// if no protocol is specified
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`
    }

    // Remove duplicate slashes (except after protocol)
    trimmedUrl = trimmedUrl.replace(/([^:]\/)\/+/g, '$1')

    // Fix www without dot
    if (trimmedUrl.includes('://www') && !trimmedUrl.includes('://www.')) {
      trimmedUrl = trimmedUrl.replace('://www', '://www.')
    }

    try {
      const url = new URL(trimmedUrl)
      
      // Basic validation
      if (!url.hostname || url.hostname.length < 3) {
        return { isValid: false, error: 'Please enter a valid domain name' }
      }

      // Check for valid TLD (at least 2 characters)
      const parts = url.hostname.split('.')
      if (parts.length < 2 || parts[parts.length - 1].length < 2) {
        return { isValid: false, error: 'Please enter a valid domain with a proper extension' }
      }

      return { isValid: true, url: trimmedUrl }
    } catch (error) {
      return { isValid: false, error: 'Please enter a valid URL format (e.g., fast.com or https://example.com)' }
    }
  }

  const captureTestUrl = async () => {
    const validation = validateUrl(testUrl)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    setCapturingTest(true)
    setTestProgress(0)
    setTestMessage('Preparing screenshot capture...')

    // Simulate progress steps
    const steps = [
      { progress: 25, message: 'Launching browser...' },
      { progress: 50, message: 'Loading webpage...' },
      { progress: 75, message: 'Capturing screenshot...' },
      { progress: 90, message: 'Uploading to storage...' },
      { progress: 100, message: 'Screenshot saved!' }
    ]

    try {
      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setTestProgress(steps[stepIndex].progress)
          setTestMessage(steps[stepIndex].message)
          stepIndex++
        } else {
          clearInterval(progressInterval)
        }
      }, 800)

      // Call screenshot API or mock in development
      let result
      if (isDevelopment()) {
        console.log('🧪 Using mock screenshot API for local development')
        clearInterval(progressInterval)
        result = await mockCaptureScreenshot(validation.url, 'test-' + Date.now())
      } else {
        const response = await fetch('/api/capture-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: validation.url,
            urlId: 'test-' + Date.now() // Use a test ID
          })
        })
        clearInterval(progressInterval)
        result = await response.json()
      }

      if (result.success) {
        setTestProgress(100)
        setTestMessage('Screenshot captured successfully!')
        
        // Show success and reset after delay
        setTimeout(() => {
          setCapturingTest(false)
          setTestProgress(0)
          setTestMessage('')
          setTestUrl('')
          alert(`Screenshot captured successfully! You can view it at: ${result.image_url}`)
        }, 2000)
      } else {
        throw new Error(result.error || 'Screenshot capture failed')
      }

    } catch (error) {
      console.error('Test screenshot error:', error)
      setTestProgress(0)
      setTestMessage('')
      setCapturingTest(false)
      alert('Failed to capture screenshot: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visual Snapshots</h1>
          <p className="text-muted-foreground">
            Track visual changes of your monitored websites over time
          </p>
        </div>
        <Button 
          onClick={captureAllScreenshots}
          disabled={capturingAll || urls.length === 0}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Capture All Screenshots
        </Button>
      </div>

      {/* Test Any URL Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">Test Screenshot Capture</CardTitle>
          <CardDescription className="text-center">
            Capture a screenshot of any website to test the feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="Enter any URL (e.g., fast.com, https://example.com)"
                className="w-full h-12 px-4 border border-input bg-background text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={capturingTest}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !capturingTest && testUrl.trim()) {
                    captureTestUrl()
                  }
                }}
              />
            </div>
            <Button
              onClick={captureTestUrl}
              disabled={capturingTest || !testUrl.trim()}
              className="h-12 px-6 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Capture Screenshot
            </Button>
          </div>
          {capturingTest && (
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">{testMessage}</div>
              <Progress value={testProgress} className="w-full h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Progress Dialog */}
      <AlertDialog open={capturingTest}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center flex items-center justify-center gap-2">
              <Camera className="h-5 w-5" />
              Capturing Test Screenshot
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Taking a screenshot of the test URL
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-6 text-center">
            <div>
              <div className="text-6xl font-bold text-primary mb-3">
                <NumberFlow 
                  value={testProgress}
                  format={{ maximumFractionDigits: 0, minimumIntegerDigits: 1 }}
                  suffix="%"
                  willChange
                />
              </div>
              <div className="text-sm text-muted-foreground">{testMessage}</div>
            </div>
            <Progress value={testProgress} className="w-full h-3" />
            <p className="text-xs text-muted-foreground">
              This may take a few seconds
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setCapturingTest(false)
                setTestProgress(0)
                setTestMessage('')
              }}
              className="mt-4"
            >
              Cancel Test
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Progress Dialog */}
      <AlertDialog open={capturingAll}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center flex items-center justify-center gap-2">
              <Camera className="h-5 w-5" />
              Capturing Screenshots
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Taking visual snapshots of all monitored websites
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-6 text-center">
            <div>
              <div className="text-6xl font-bold text-primary mb-3">
                <NumberFlow 
                  value={capturingProgress}
                  format={{ maximumFractionDigits: 0, minimumIntegerDigits: 1 }}
                  suffix="%"
                  willChange
                />
              </div>
              <div className="text-sm text-muted-foreground">{capturingMessage}</div>
            </div>
            <Progress value={capturingProgress} className="w-full h-3" />
            <p className="text-xs text-muted-foreground">
              This may take a few minutes depending on the number of websites
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* URLs Grid */}
      {urls.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Monitored URLs</h3>
            <p className="text-muted-foreground mb-4">
              Add some URLs to your monitoring list to start capturing visual snapshots
            </p>
            <Button onClick={() => window.location.href = '/urls'}>
              Go to URL Management
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {urls.map((url) => {
            const latestScreenshot = getLatestScreenshot(url.id)
            const screenshotCount = getScreenshotCount(url.id)
            
            return (
              <Card key={url.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {url.name || 'Unnamed Website'}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {cleanUrl(url.url)}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        captureScreenshot(url.id, url.url)
                      }}
                      className="flex-shrink-0 ml-3"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Screenshot Preview */}
                  <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden border">
                    {latestScreenshot ? (
                      <img 
                        src={latestScreenshot.image_url} 
                        alt={`Screenshot of ${url.name || url.url}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No screenshots yet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {screenshotCount} snapshots
                      </Badge>
                      {latestScreenshot && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(latestScreenshot.captured_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {latestScreenshot && (
                      <Link to={`/snapshots/${url.id}/timeline`}>
                        <Button size="sm" variant="ghost" className="text-xs">
                          View Timeline
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Snapshots
