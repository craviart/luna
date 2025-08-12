import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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
      
      // Load daily usage summary
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_api_usage')
        .select('*')
        .order('usage_date', { ascending: false })
        .limit(7)

      if (dailyError) throw dailyError

      // Load API health status
      const { data: healthData, error: healthError } = await supabase
        .from('api_health_status')
        .select('*')

      if (healthError) throw healthError

      // Load recent logs (last 50)
      const { data: logsData, error: logsError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (logsError) throw logsError

      setDailyUsage(dailyData || [])
      setHealthStatus(healthData?.[0] || null)
      setRecentLogs(logsData || [])

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
        <Alert>
          <AlertDescription>
            Error loading monitoring data: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PageSpeed API Monitoring</h1>
      
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

      {/* Daily Usage Chart */}
      {dailyUsage.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily API Usage (Last 7 Days)</CardTitle>
            <CardDescription>Request volume and success rates by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyUsage.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="usage_date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successful_requests" stackId="a" fill="#10b981" name="Successful" />
                <Bar dataKey="failed_requests" stackId="a" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
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
