import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://akvdrwpdnllxwuennifr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdmRyd3BkbmxseHd1ZW5uaWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkyMDgsImV4cCI6MjA2OTk4NTIwOH0.aAkFE9VwddTVhhLDuF3Agb4LBPCzzopoAXgrSr3kBv8'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database helper functions (no user authentication required)
export const db = {
  async getUrls() {
    try {
      // Try with display_order first (for reordering feature)
      return await supabase
        .from('urls')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
    } catch (error) {
      // Fallback to created_at only if display_order column doesn't exist
      console.log('Falling back to created_at ordering:', error.message)
      return await supabase
        .from('urls')
        .select('*')
        .order('created_at', { ascending: false })
    }
  },

  async getDashboardUrls() {
    try {
      // Get URLs that should show on dashboard
      return await supabase
        .from('urls')
        .select('*')
        .eq('show_on_dashboard', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
    } catch (error) {
      // Fallback if show_on_dashboard column doesn't exist yet
      console.log('Falling back to all URLs for dashboard:', error.message)
      return await this.getUrls()
    }
  },

  async addUrl(url, name = '', description = '', showOnDashboard = false) {
    return await supabase
      .from('urls')
      .insert([{
        url,
        name,
        description,
        show_on_dashboard: showOnDashboard
      }])
      .select()
  },

  async getAnalysisResults(urlId = null) {
    let query = supabase
      .from('analysis_results')
      .select('*, urls(name, url)')
      .order('created_at', { ascending: false })

    if (urlId) {
      query = query.eq('url_id', urlId)
    }

    return await query
  },

  async addAnalysisResult(result) {
    return await supabase
      .from('analysis_results')
      .insert([result])
      .select()
  },

  async updateUrlOrder(urlId, displayOrder) {
    try {
      return await supabase
        .from('urls')
        .update({ display_order: displayOrder })
        .eq('id', urlId)
    } catch (error) {
      console.log('Cannot update display order - column may not exist:', error.message)
      throw new Error('Display order column not found. Please run the database migration script.')
    }
  }
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('urls').select('count', { count: 'exact', head: true })
    if (error) throw error
    return { success: true, message: 'Connected to Supabase successfully' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}
