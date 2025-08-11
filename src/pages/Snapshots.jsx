import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { supabase } from '../lib/supabase-simple'
import { Camera, Calendar, Clock, Download, Eye, RefreshCw, Zap } from 'lucide-react'
import NumberFlow from '@number-flow/react'

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
      const response = await fetch('/api/capture-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, urlId })
      })

      const result = await response.json()
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

      {/* Progress Dialog */}
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
                      <Button size="sm" variant="ghost" className="text-xs">
                        View Timeline
                      </Button>
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
