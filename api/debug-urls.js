// Debug endpoint to check URLs in database
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    console.log('🔍 Debug: Checking URLs in database...')
    
    // Get all URLs
    const { data: allUrls, error: urlsError } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false })

    if (urlsError) {
      console.error('Error fetching URLs:', urlsError)
      return res.status(500).json({ 
        error: 'Failed to fetch URLs',
        details: urlsError 
      })
    }

    // Get recent analysis results
    const { data: recentAnalyses, error: analysesError } = await supabase
      .from('analysis_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (analysesError) {
      console.error('Error fetching analyses:', analysesError)
    }

    // Get quick tests
    const { data: quickTests, error: quickTestsError } = await supabase
      .from('quick_tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (quickTestsError) {
      console.error('Error fetching quick tests:', quickTestsError)
    }

    return res.status(200).json({
      summary: {
        total_urls: allUrls?.length || 0,
        dashboard_visible_urls: allUrls?.filter(u => u.show_on_dashboard)?.length || 0,
        recent_analyses: recentAnalyses?.length || 0,
        recent_quick_tests: quickTests?.length || 0
      },
      urls: allUrls?.map(url => ({
        id: url.id,
        url: url.url,
        name: url.name,
        show_on_dashboard: url.show_on_dashboard,
        created_at: url.created_at
      })) || [],
      recent_analyses: recentAnalyses?.map(a => ({
        id: a.id,
        url_id: a.url_id,
        url: a.url,
        performance_score: a.performance_score,
        created_at: a.created_at,
        success: a.success
      })) || [],
      recent_quick_tests: quickTests?.map(q => ({
        id: q.id,
        url: q.url,
        performance_score: q.performance_score,
        created_at: q.created_at,
        success: q.success
      })) || []
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message
    })
  }
}
