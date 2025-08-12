// Setup endpoint to add sample URLs for testing
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    console.log('🔧 Setting up sample URLs for monitoring...')

    // Sample URLs to monitor
    const sampleUrls = [
      {
        url: 'https://github.com',
        name: 'GitHub',
        description: 'GitHub homepage performance monitoring',
        show_on_dashboard: true,
        active: true
      },
      {
        url: 'https://vercel.com',
        name: 'Vercel',
        description: 'Vercel homepage performance monitoring',
        show_on_dashboard: true,
        active: true
      }
    ]

    const results = []

    for (const urlData of sampleUrls) {
      // Check if URL already exists
      const { data: existing, error: checkError } = await supabase
        .from('urls')
        .select('id, url')
        .eq('url', urlData.url)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking existing URL:', checkError)
        results.push({
          url: urlData.url,
          status: 'error',
          message: `Error checking existing: ${checkError.message}`
        })
        continue
      }

      if (existing) {
        // Update existing URL to ensure it shows on dashboard
        const { error: updateError } = await supabase
          .from('urls')
          .update({
            show_on_dashboard: true,
            active: true,
            name: urlData.name,
            description: urlData.description
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating URL:', updateError)
          results.push({
            url: urlData.url,
            status: 'error',
            message: `Error updating: ${updateError.message}`
          })
        } else {
          results.push({
            url: urlData.url,
            status: 'updated',
            message: 'URL updated to show on dashboard'
          })
        }
      } else {
        // Insert new URL
        const { error: insertError } = await supabase
          .from('urls')
          .insert(urlData)

        if (insertError) {
          console.error('Error inserting URL:', insertError)
          results.push({
            url: urlData.url,
            status: 'error',
            message: `Error inserting: ${insertError.message}`
          })
        } else {
          results.push({
            url: urlData.url,
            status: 'created',
            message: 'URL created successfully'
          })
        }
      }
    }

    // Get current state
    const { data: allUrls, error: urlsError } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false })

    return res.status(200).json({
      success: true,
      message: 'Sample URLs setup completed',
      results,
      current_urls: allUrls?.map(url => ({
        id: url.id,
        url: url.url,
        name: url.name,
        show_on_dashboard: url.show_on_dashboard,
        active: url.active
      })) || []
    })

  } catch (error) {
    console.error('Setup error:', error)
    return res.status(500).json({
      success: false,
      error: 'Setup failed',
      message: error.message
    })
  }
}
