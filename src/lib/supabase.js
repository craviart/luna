import { createClient } from '@supabase/supabase-js'

// These will be your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have real credentials
export const supabase = (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) 
  ? null 
  : createClient(supabaseUrl, supabaseKey)

// Database helper functions with null checks
export const db = {
  async getUrls() {
    if (!supabase) return { data: [], error: null }
    const { data, error } = await supabase
      .from('urls')
      .select(`*, analysis_results(count)`)
      .order('created_at', { ascending: false })
    return { data: data || [], error }
  },

  async addUrl(url, name, description) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('urls')
      .insert([{ url, name: name || url, description: description || '' }])
      .select()
    if (error) throw error
    return data[0]
  },

  async getAnalyticsSummary() {
    if (!supabase) return {
      totalAnalyses: 0,
      uniqueUrls: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      avgLoadTime: 0
    }
    
    const { count: totalAnalyses } = await supabase
      .from('analysis_results')
      .select('*', { count: 'exact', head: true })
    
    return {
      totalAnalyses: totalAnalyses || 0,
      uniqueUrls: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      avgLoadTime: 0
    }
  }
}
