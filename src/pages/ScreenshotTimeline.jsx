import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Calendar, Download, ExternalLink, ArrowLeft, Copy, Eye, MoreVertical, Calendar as CalendarIcon } from 'lucide-react'
import { supabase } from '../lib/supabase-simple'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'

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

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }
}

// Download image function
const downloadImage = async (imageUrl, filename) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    alert('Failed to download image')
  }
}

function ScreenshotTimeline() {
  const { id } = useParams()
  const [url, setUrl] = useState(null)
  const [screenshots, setScreenshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedScreenshots, setSelectedScreenshots] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month

  useEffect(() => {
    fetchUrlAndScreenshots()
  }, [id])

  const fetchUrlAndScreenshots = async () => {
    try {
      // Fetch URL details
      const { data: urlData, error: urlError } = await supabase
        .from('urls')
        .select('*')
        .eq('id', id)
        .single()

      if (urlError) throw urlError
      setUrl(urlData)

      // Fetch screenshots for this URL
      const { data: screenshotsData, error: screenshotsError } = await supabase
        .from('website_screenshots')
        .select('*')
        .eq('url_id', id)
        .order('captured_at', { ascending: false })

      if (screenshotsError) throw screenshotsError
      setScreenshots(screenshotsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScreenshotSelect = (screenshot) => {
    if (selectedScreenshots.includes(screenshot.id)) {
      setSelectedScreenshots(selectedScreenshots.filter(id => id !== screenshot.id))
    } else if (selectedScreenshots.length < 2) {
      setSelectedScreenshots([...selectedScreenshots, screenshot.id])
    }
  }

  const getSelectedScreenshotData = () => {
    return selectedScreenshots.map(id => screenshots.find(s => s.id === id))
  }

  const downloadAllScreenshots = async () => {
    if (screenshots.length === 0) return
    
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i]
      const { date, time } = formatDate(screenshot.captured_at)
      const filename = `${cleanUrl(url.url)}_${date}_${time.replace(':', '-')}.jpg`
      
      // Add delay between downloads to avoid overwhelming the browser
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      await downloadImage(screenshot.image_url, filename)
    }
  }

  const filteredScreenshots = screenshots.filter(screenshot => {
    if (dateFilter === 'all') return true
    
    const screenshotDate = new Date(screenshot.captured_at)
    const now = new Date()
    
    switch (dateFilter) {
      case 'today':
        return screenshotDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return screenshotDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return screenshotDate >= monthAgo
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">URL Not Found</h1>
        <Link to="/snapshots">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Snapshots
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/snapshots">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{url.name || 'Unnamed Website'}</h1>
            <p className="text-muted-foreground">{cleanUrl(url.url)} • {screenshots.length} screenshots</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {screenshots.length > 0 && (
            <Button onClick={downloadAllScreenshots} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          )}
          <Button asChild>
            <a href={url.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </a>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex space-x-2">
                {['all', 'today', 'week', 'month'].map((filter) => (
                  <Button
                    key={filter}
                    variant={dateFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter(filter)}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
                  </Button>
                ))}
              </div>
            </div>
            {selectedScreenshots.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedScreenshots.length} selected
                </Badge>
                {selectedScreenshots.length === 2 && (
                  <Button size="sm" onClick={() => setShowComparison(true)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedScreenshots([])}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Grid */}
      {filteredScreenshots.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Screenshots Found</h3>
            <p className="text-muted-foreground mb-4">
              {dateFilter === 'all' ? 'No screenshots have been captured for this URL yet.' : 'No screenshots found for the selected time period.'}
            </p>
            <Link to="/snapshots">
              <Button>Go to Snapshots</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredScreenshots.map((screenshot) => {
            const { date, time } = formatDate(screenshot.captured_at)
            const isSelected = selectedScreenshots.includes(screenshot.id)
            
            return (
              <Card 
                key={screenshot.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleScreenshotSelect(screenshot)}
              >
                <CardContent className="p-4">
                  {/* Screenshot Image */}
                  <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden relative group">
                    <img 
                      src={screenshot.image_url} 
                      alt={`Screenshot from ${date} ${time}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFullscreenImage(screenshot)
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground">
                          {selectedScreenshots.indexOf(screenshot.id) + 1}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Screenshot Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{date}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setFullscreenImage(screenshot)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Size
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            downloadImage(screenshot.image_url, `${cleanUrl(url.url)}_${date}_${time.replace(':', '-')}.jpg`)
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            window.open(screenshot.image_url, '_blank')
                          }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-xs text-muted-foreground">{time}</div>
                    <div className="text-xs text-muted-foreground">
                      {screenshot.viewport_width}×{screenshot.viewport_height}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {fullscreenImage && formatDate(fullscreenImage.captured_at).date} {formatDate(fullscreenImage.captured_at).time}
            </DialogTitle>
            <DialogDescription>
              {url?.name || cleanUrl(url?.url)}
            </DialogDescription>
          </DialogHeader>
          {fullscreenImage && (
            <div className="overflow-auto">
              <img 
                src={fullscreenImage.image_url} 
                alt="Full size screenshot"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Screenshot Comparison</DialogTitle>
            <DialogDescription>
              Compare screenshots side by side
            </DialogDescription>
          </DialogHeader>
          {selectedScreenshots.length === 2 && (
            <div className="grid grid-cols-2 gap-4 overflow-auto">
              {getSelectedScreenshotData().map((screenshot, index) => {
                const { date, time } = formatDate(screenshot.captured_at)
                return (
                  <div key={screenshot.id} className="space-y-2">
                    <div className="text-center font-medium">{date} {time}</div>
                    <img 
                      src={screenshot.image_url} 
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-auto border rounded-lg"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ScreenshotTimeline
