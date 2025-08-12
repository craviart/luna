import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
// Charts will be added later - for now show basic data
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const APIMonitoring = () => {
  const [dailyUsage, setDailyUsage] = useState([])
  const [healthStatus, setHealthStatus] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMonitoringData()
  }, [])

  const loadMonitoringData = async () => {
    try {
      setLoading(true)
      console.log('Loading monitoring data...')
      
      // Load daily usage summary
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_api_usage')
        .select('*')
        .order('usage_date', { ascending: false })
        .limit(7)

      console.log('Daily data:', dailyData, 'Error:', dailyError)

      // Load API health status  
      const { data: healthData, error: healthError } = await supabase
        .from('api_health_status')
        .select('*')

      console.log('Health data:', healthData, 'Error:', healthError)

      // Load recent logs (last 50)
      const { data: logsData, error: logsError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      console.log('Logs data:', logsData, 'Error:', logsError)

      // Don't throw errors immediately - set data even if some queries fail
      setDailyUsage(dailyData || [])
      setHealthStatus(healthData?.[0] || null)
      setRecentLogs(logsData || [])

      // Only set error if all queries failed
      if (dailyError && healthError && logsError) {
        setError(`Database errors: ${dailyError?.message || ''}, ${healthError?.message || ''}, ${logsError?.message || ''}`)
      }

    } catch (err) {
      console.error('Error loading monitoring data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (success) => {
    return success ? 'bg-green-500' : 'bg-red-500'
  }

  const getErrorBadgeColor = (errorCode) => {
    switch (errorCode) {
      case 'QUOTA_EXCEEDED': return 'destructive'
      case 'TIMEOUT': return 'secondary'
      case 'ACCESS_DENIED': return 'destructive'
      case 'INVALID_URL': return 'outline'
      default: return 'secondary'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">API Monitoring</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">API Monitoring</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">
              Error loading monitoring data: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PageSpeed API Monitoring</h1>
      
      {/* Debug Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Daily Usage Records: {dailyUsage.length}</div>
            <div>Health Status: {healthStatus ? 'Available' : 'None'}</div>
            <div>Recent Logs: {recentLogs.length}</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Health Status Overview */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthStatus.requests_last_hour || 0}</div>
              <p className="text-xs text-muted-foreground">
                {healthStatus.successful_last_hour || 0} successful
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthStatus.requests_last_24h || 0}</div>
              <p className="text-xs text-muted-foreground">
                {healthStatus.successful_last_24h || 0} successful
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quota Errors (1h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                healthStatus.quota_errors_last_hour > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {healthStatus.quota_errors_last_hour || 0}
              </div>
              <p className="text-xs text-muted-foreground">API limits hit</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus.avg_response_time_last_hour 
                  ? `${Math.round(healthStatus.avg_response_time_last_hour)}ms`
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">Last hour</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Usage Summary */}
      {dailyUsage.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily API Usage (Last 7 Days)</CardTitle>
            <CardDescription>Request volume and success rates by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyUsage.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{day.usage_date}</div>
                    <div className="text-sm text-muted-foreground">{day.request_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{day.total_requests} total</div>
                    <div className="text-sm">
                      <span className="text-green-600">{day.successful_requests} success</span>
                      {day.failed_requests > 0 && (
                        <span className="text-red-600 ml-2">{day.failed_requests} failed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent API Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Last 50 PageSpeed API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(log.success)}`}></div>
                  <div>
                    <div className="font-medium text-sm">{log.request_url}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)} • {log.request_type}
                      {log.api_key_used && ' • Authenticated'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {log.success ? (
                    <>
                      <Badge variant="outline">{log.response_time_ms}ms</Badge>
                      {log.performance_score && (
                        <Badge variant="secondary">{log.performance_score}%</Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant={getErrorBadgeColor(log.error_code)}>
                      {log.error_code || 'ERROR'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default APIMonitoring
