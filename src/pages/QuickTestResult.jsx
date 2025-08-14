import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { 
  ArrowLeft, 
  Clock, 
  Zap, 
  Activity, 
  FileCode, 
  TestTube,
  ExternalLink,
  Loader2,
  Trash2,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase-simple'
import { toast } from 'sonner'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../components/ui/hover-card'

// Clean URL display function - remove protocol and www for cooler look
const cleanUrl = (url) => {
  if (!url) return url
  
  return url
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/^www\./, '')       // Remove www.
}

function MetricCard({ title, value, icon: Icon, description, color = "text-foreground" }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function QuickTestResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quickTest, setQuickTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadQuickTest()
  }, [id])

  const loadQuickTest = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quick_tests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setQuickTest(data)
    } catch (error) {
      console.error('Error loading quick test:', error)
      toast.error('Failed to load test result')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      const { error } = await supabase
        .from('quick_tests')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Test deleted successfully')
      navigate('/quick-testing')
    } catch (error) {
      console.error('Error deleting test:', error)
      toast.error('Failed to delete test')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading test result...</span>
        </div>
      </div>
    )
  }

  if (!quickTest) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Test Result Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested test result could not be found.
          </p>
          <Button asChild>
            <Link to="/quick-testing">
              Back to Quick Testing
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const analysisResult = quickTest.analysis_result || {}
  
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

  const formatTime = (time) => {
    if (!time) return 'N/A'
    return `${(time / 1000).toFixed(2)}s`
  }

  // Colored Badge Component
  const ColoredBadge = ({ value, color, children, variant = "ghost" }) => (
    <Badge variant={variant} className={`flex items-center gap-1 text-base ${variant === "ghost" ? "border-0" : ""}`}>
      <div 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      {children || value}
    </Badge>
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const coverageData = analysisResult.coverage_data || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/quick-testing">
                Back to Quick Testing
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold truncate">{cleanUrl(quickTest.url)}</h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Tested {formatDate(quickTest.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TestTube className="h-4 w-4" />
              <span>Quick Test</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={quickTest.url} target="_blank" rel="noopener noreferrer">
                Visit Site
              </a>
            </Button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quick Test</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this quick test? This action cannot be undone.
                  <div className="mt-2 text-sm font-medium">
                    URL: {cleanUrl(quickTest.url)}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Performance Score"
            value={`${quickTest.performance_score || 'N/A'}/100`}
            icon={Zap}
            description="Overall Lighthouse score"
            color={getPerformanceColor(quickTest.performance_score)}
          />
          
          <MetricCard
            title={
              <div className="flex items-center gap-2">
                First Contentful Paint
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
            }
            value={formatTime(quickTest.fcp_time)}
            icon={Activity}
            description="Time to first content"
            color={getFCPColor(quickTest.fcp_time)}
          />
          
          <MetricCard
            title={
              <div className="flex items-center gap-2">
                Largest Contentful Paint
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
            }
            value={formatTime(quickTest.lcp_time)}
            icon={Activity}
            description="Time to largest content"
            color={getLCPColor(quickTest.lcp_time)}
          />
          

        </div>
      </div>

      {/* Additional Lighthouse Metrics */}
      {(quickTest.speed_index || quickTest.total_blocking_time || quickTest.cumulative_layout_shift !== null) && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-4">Additional Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickTest.speed_index && (
                <MetricCard
                  title="Speed Index"
                  value={formatTime(quickTest.speed_index)}
                  icon={Activity}
                  description="Visual completion speed"
                />
              )}
              
              {quickTest.total_blocking_time && (
                <MetricCard
                  title="Total Blocking Time"
                  value={formatTime(quickTest.total_blocking_time)}
                  icon={Activity}
                  description="Main thread blocking time"
                />
              )}
              
              {quickTest.cumulative_layout_shift !== null && (
                <MetricCard
                  title="Cumulative Layout Shift"
                  value={quickTest.cumulative_layout_shift.toFixed(3)}
                  icon={Activity}
                  description="Visual stability score"
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Coverage Analysis */}


      {/* Raw Data Summary */}
      {analysisResult.raw_data && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-4">Analysis Summary</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Load Time</p>
                    <p className="font-semibold">{formatTime(analysisResult.load_time)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Scripts</p>
                    <p className="font-semibold">{analysisResult.raw_data.script_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Stylesheets</p>
                    <p className="font-semibold">{analysisResult.raw_data.style_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Word Count</p>
                    <p className="font-semibold">{analysisResult.raw_data.word_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}