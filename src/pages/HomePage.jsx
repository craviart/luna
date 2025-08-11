import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { testSupabaseConnection } from '../lib/supabase-simple'

export default function HomePage() {
  const [status, setStatus] = useState('Loading...')
  
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const isConnected = await testSupabaseConnection()
      if (isConnected) {
        setStatus('✅ Connected to Supabase!')
      } else {
        setStatus('❌ Supabase not configured')
      }
    } catch (error) {
      setStatus('❌ Connection failed')
    }
  }
  
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <img src="/luna.svg" alt="Millie" className="h-10 w-10" />
            Luna Analytics
          </h1>
        <p className="text-xl text-gray-600 mb-8">
          Modern web analytics powered by Chrome DevTools API
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">🚀 System Status</h2>
          <p className="text-lg mb-4">{status}</p>
          
          <div className="text-left space-y-2">
            <p className="text-green-600">✅ Supabase client initialized</p>
            <p className="text-green-600">✅ Cloud database connected</p>
            <p className="text-green-600">✅ Serverless analysis ready</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Performance</h3>
            <p className="text-sm text-gray-600">Load times, Core Web Vitals, and page speed metrics</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">SEO Analysis</h3>
            <p className="text-sm text-gray-600">Titles, meta tags, headings, and content structure</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">♿</div>
            <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
            <p className="text-sm text-gray-600">Alt text, WCAG compliance, and usability checks</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium text-blue-900 mb-4">🚀 Get Started</h3>
          <p className="text-blue-700 mb-4">
            Ready to analyze your websites? Add URLs to monitor and get detailed insights.
          </p>
          <Link
            to="/urls"
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-blue-500 transition"
          >
            🔗 Manage URLs
          </Link>
        </div>
      </div>
    </div>
  )
}
