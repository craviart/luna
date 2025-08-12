import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  X, 
  Calendar, 
  ExternalLink, 
  BarChart3,
  LinkIcon,
  Loader2,
  Play,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import NumberFlow from '@number-flow/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../components/ui/alert-dialog'

import { db, supabase } from '../lib/supabase-simple'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

// Clean URL display function - remove protocol and www for cooler look
const cleanUrl = (url) => {
  if (!url) return url
  
  return url
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/^www\./, '')       // Remove www.
}

// URL Card Component (no longer sortable via drag-and-drop)
function URLCard({ url, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  // Utility functions
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

  return (
    <Link to={`/urls/${url.id}/results`} className="block">
      <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-base font-medium hover:text-primary transition-colors truncate">
                  {url.name || 'Unnamed Website'}
                </CardTitle>
              </div>
              <div className="text-sm text-muted-foreground truncate mb-2">
                {cleanUrl(url.url)}
              </div>
              {url.description && (
                <CardDescription className="text-xs line-clamp-1">
                  {url.description}
                </CardDescription>
              )}
            </div>
            
            {/* Performance Score Display - Vertically Centered */}
            <div className="flex items-center ml-4 flex-shrink-0">
              {url.latestPerformanceScore ? (
                <div className="text-center">
                  <div className="text-2xl font-bold leading-none" style={{ color: getPerformanceColor(url.latestPerformanceScore) }}>
                    {url.latestPerformanceScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground leading-none">
                    --
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              )}
            </div>
            
            {/* Reorder buttons - Vertically Centered and Larger */}
            <div className="flex flex-col gap-2 ml-4 flex-shrink-0" onClick={(e) => e.preventDefault()}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onMoveUp(url.id)
                }}
                disabled={!canMoveUp}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onMoveDown(url.id)
                }}
                disabled={!canMoveDown}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <span>Active</span>
            </div>
            <div className="mx-2 text-muted-foreground/50">|</div>
            <span className="truncate">
              {url.lastAnalysisDate ? 
                `Last analyzed ${new Date(url.lastAnalysisDate).toLocaleDateString()}` :
                `Added ${new Date(url.created_at).toLocaleDateString()}`
              }
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function URLsPage() {
  const [urls, setUrls] = useState([])
  const [urlsWithScores, setUrlsWithScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    showOnDashboard: false
  })
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkProgressMessage, setBulkProgressMessage] = useState('')
  const [currentAnalyzingUrl, setCurrentAnalyzingUrl] = useState('')


  
  const { user } = useAuth()

  useEffect(() => {
    loadUrls()
  }, [])

  const loadUrls = async () => {
    try {
      const { data, error } = await db.getUrls()
      if (error) throw error
      setUrls(data)
      
      // Fetch latest performance scores for each URL
      const urlsWithPerformance = await Promise.all(
        data.map(async (url) => {
          try {
            // Get the most recent analysis result with a performance score
            const { data: analysisData, error } = await supabase
              .from('analysis_results')
              .select('performance_score, created_at, fcp_time, lcp_time')
              .eq('url_id', url.id)
              .not('performance_score', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            console.log(`URL ${url.id} (${url.name}) analysis data:`, analysisData)
            
            return {
              ...url,
              latestPerformanceScore: analysisData?.performance_score || null,
              lastAnalysisDate: analysisData?.created_at || null
            }
          } catch (error) {
            console.log(`Error fetching analysis for URL ${url.id}:`, error)
            return {
              ...url,
              latestPerformanceScore: null,
              lastAnalysisDate: null
            }
          }
        })
      )
      
      // Sort URLs: dashboard visible first (by display_order), then hidden ones
      const sortedUrls = urlsWithPerformance.sort((a, b) => {
        // First sort by dashboard visibility
        if (a.show_on_dashboard && !b.show_on_dashboard) return -1
        if (!a.show_on_dashboard && b.show_on_dashboard) return 1
        
        // Within same visibility group, sort by display_order
        return (a.display_order || 0) - (b.display_order || 0)
      })
      
      setUrlsWithScores(sortedUrls)
    } catch (error) {
      toast.error('Failed to load URLs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.url) {
      toast.error('URL is required')
      return
    }

    try {
      await db.addUrl(formData.url, formData.name, formData.description, formData.showOnDashboard)
      toast.success('URL added successfully!', {
        description: 'You can now run analysis on this URL'
      })
      setFormData({ url: '', name: '', description: '', showOnDashboard: false })
      setIsDialogOpen(false)
      loadUrls()
    } catch (error) {
      toast.error('Failed to add URL')
    }
  }

  // Move URL up or down in the dashboard-visible list only
  const handleMoveUp = async (urlId) => {
    const currentUrl = urlsWithScores.find(url => url.id === urlId)
    if (!currentUrl?.show_on_dashboard) return // Only move dashboard-visible URLs
    
    const dashboardUrls = urlsWithScores.filter(url => url.show_on_dashboard)
    const currentIndex = dashboardUrls.findIndex(url => url.id === urlId)
    if (currentIndex <= 0) return

    // Swap dashboard positions
    const newDashboardUrls = [...dashboardUrls]
    const temp = newDashboardUrls[currentIndex]
    newDashboardUrls[currentIndex] = newDashboardUrls[currentIndex - 1]
    newDashboardUrls[currentIndex - 1] = temp

    // Update display_order for the swapped URLs
    try {
      await db.updateUrlOrder(newDashboardUrls[currentIndex].id, currentIndex + 1)
      await db.updateUrlOrder(newDashboardUrls[currentIndex - 1].id, currentIndex)
      
      // Reload to get fresh sorted data
      await loadUrls()
      toast.success('Dashboard order updated!')
    } catch (error) {
      console.error('Error updating dashboard order:', error)
      toast.error('Failed to update dashboard order')
    }
  }

  const handleMoveDown = async (urlId) => {
    const currentUrl = urlsWithScores.find(url => url.id === urlId)
    if (!currentUrl?.show_on_dashboard) return // Only move dashboard-visible URLs
    
    const dashboardUrls = urlsWithScores.filter(url => url.show_on_dashboard)
    const currentIndex = dashboardUrls.findIndex(url => url.id === urlId)
    if (currentIndex >= dashboardUrls.length - 1) return

    // Swap dashboard positions
    const newDashboardUrls = [...dashboardUrls]
    const temp = newDashboardUrls[currentIndex]
    newDashboardUrls[currentIndex] = newDashboardUrls[currentIndex + 1]
    newDashboardUrls[currentIndex + 1] = temp

    // Update display_order for the swapped URLs
    try {
      await db.updateUrlOrder(newDashboardUrls[currentIndex].id, currentIndex + 1)
      await db.updateUrlOrder(newDashboardUrls[currentIndex + 1].id, currentIndex + 2)
      
      // Reload to get fresh sorted data
      await loadUrls()
      toast.success('Dashboard order updated!')
    } catch (error) {
      console.error('Error updating dashboard order:', error)
      toast.error('Failed to update dashboard order')
    }
  }

  const handleBulkAnalysis = async () => {
    if (urlsWithScores.length === 0) {
      toast.error('No URLs to analyze')
      return
    }

    setIsBulkAnalyzing(true)
    setBulkProgress(0)
    setBulkProgressMessage('Initializing bulk analysis...')

    try {
      const totalUrls = urlsWithScores.length
      
      // Initial preparation phase
      setBulkProgress(2)
      setBulkProgressMessage('Preparing analysis queue...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      for (let i = 0; i < urlsWithScores.length; i++) {
        const url = urlsWithScores[i]
        const urlProgress = i / totalUrls * 100
        
        // Start of individual analysis
        setCurrentAnalyzingUrl(url.name || url.url)
        setBulkProgress(Math.round(urlProgress + 1))
        setBulkProgressMessage(`Starting analysis for ${url.name || url.url}...`)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Mid-analysis progress
        setBulkProgress(Math.round(urlProgress + (100 / totalUrls) * 0.3))
        setBulkProgressMessage(`Gathering metrics for ${url.name || url.url}...`)
        await new Promise(resolve => setTimeout(resolve, 400))
        
        setBulkProgress(Math.round(urlProgress + (100 / totalUrls) * 0.6))
        setBulkProgressMessage(`Processing data for ${url.name || url.url}...`)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
          const response = await fetch('/api/analyze-pagespeed-only', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url.url,
              urlId: url.id,
              isQuickTest: false
            }),
          })

          // Check if response is ok before parsing JSON
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`API response error for ${url.name}:`, errorText)
            setBulkProgressMessage(`⚠️ Server error for ${url.name || url.url}`)
            continue // Skip to next URL
          }

          let result
          try {
            result = await response.json()
          } catch (parseError) {
            console.error(`Failed to parse response for ${url.name}:`, parseError)
            setBulkProgressMessage(`⚠️ Invalid response for ${url.name || url.url}`)
            continue // Skip to next URL
          }
          
          if (!result.success) {
            console.error(`Analysis failed for ${url.name}: ${result.message}`)
            setBulkProgressMessage(`⚠️ Analysis failed for ${url.name || url.url}`)
          } else {
            setBulkProgressMessage(`✅ Completed analysis for ${url.name || url.url}`)
          }
        } catch (error) {
          console.error(`Error analyzing ${url.name}:`, error)
          setBulkProgressMessage(`❌ Error analyzing ${url.name || url.url}`)
        }

        // Complete this URL's analysis
        const progress = Math.round(((i + 1) / totalUrls) * 98) // Reserve last 2% for finalization
        setBulkProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Finalization phase
      setBulkProgress(99)
      setBulkProgressMessage('Finalizing results...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setBulkProgress(100)
      setBulkProgressMessage('Bulk analysis completed!')
      toast.success(`Analysis completed for ${totalUrls} website${totalUrls > 1 ? 's' : ''}!`)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Reload URLs to get updated data
      await loadUrls()
    } catch (error) {
      console.error('Bulk analysis error:', error)
      toast.error('Bulk analysis failed')
    } finally {
      setIsBulkAnalyzing(false)
      setBulkProgress(0)
      setBulkProgressMessage('')
      setCurrentAnalyzingUrl('')
    }
  }





  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading URLs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 rounded-full">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Automatic Analysis</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Analysis 3x daily (6am, 2pm, 10pm UTC) • All monitored pages enabled
            </p>
          </div>
          <div className="mt-6 sm:mt-0 flex gap-3">
            <Button 
              variant="secondary" 
              onClick={handleBulkAnalysis}
              disabled={isBulkAnalyzing || urlsWithScores.length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Analyze All
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add URL
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New URL</DialogTitle>
                  <DialogDescription>
                    Enter the details of the website you want to analyze
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="url">
                      Website URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description of this website"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showOnDashboard"
                      checked={formData.showOnDashboard}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnDashboard: checked }))}
                    />
                    <Label htmlFor="showOnDashboard" className="text-sm">
                      Show on dashboard
                    </Label>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Add URL
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>



        {/* URLs Grid */}
        {urlsWithScores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LinkIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-2xl mb-2">No URLs added yet</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                Start by adding your first website to analyze and track its performance.
              </CardDescription>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First URL
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Visible URLs */}
            {urlsWithScores.filter(url => url.show_on_dashboard).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Visible on Dashboard
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {urlsWithScores
                    .filter(url => url.show_on_dashboard)
                    .map((url, index, dashboardUrls) => (
                      <URLCard 
                        key={url.id} 
                        url={url} 
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        canMoveUp={index > 0}
                        canMoveDown={index < dashboardUrls.length - 1}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Hidden URLs */}
            {urlsWithScores.filter(url => !url.show_on_dashboard).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Hidden from Dashboard
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {urlsWithScores
                    .filter(url => !url.show_on_dashboard)
                    .map((url) => (
                      <URLCard 
                        key={url.id} 
                        url={url} 
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        canMoveUp={false} // No reordering for hidden URLs
                        canMoveDown={false}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Analysis Progress Dialog */}
        <AlertDialog open={isBulkAnalyzing}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">
                Analyzing Websites
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-6 text-center">
              {/* Large animated percentage display */}
              <div>
                <div className="text-6xl font-bold text-primary mb-3">
                  <NumberFlow 
                    value={bulkProgress}
                    format={{ maximumFractionDigits: 0, minimumIntegerDigits: 1 }}
                    suffix="%"
                    willChange
                  />
                </div>
                <div className="text-sm text-muted-foreground">{bulkProgressMessage}</div>
              </div>
              
              {/* Progress bar */}
              <Progress value={bulkProgress} className="w-full h-3" />
              
              {/* Current analysis info */}
              {currentAnalyzingUrl && (
                <div className="text-sm font-medium text-foreground">{currentAnalyzingUrl}</div>
              )}
              
              <p className="text-xs text-muted-foreground">
                This may take a few minutes depending on the number of websites
              </p>
              
              {/* Cancel button */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsBulkAnalyzing(false)
                  setBulkProgress(0)
                  setBulkProgressMessage('')
                  setCurrentAnalyzingUrl('')
                }}
                className="mt-4"
              >
                Cancel Analysis
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
