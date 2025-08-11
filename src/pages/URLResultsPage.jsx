import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase-simple'

// Clean URL display function - remove protocol and www for cooler look
const cleanUrl = (url) => {
  if (!url) return url
  
  return url
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/^www\./, '')       // Remove www.
}

export default function URLResultsPage() {
  const { id } = useParams()
  const [url, setUrl] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUrlAndResults()
  }, [id])

  const loadUrlAndResults = async () => {
    try {
      // Load URL details
      const { data: urlData, error: urlError } = await supabase
        .from('urls')
        .select('*')
        .eq('id', id)
        .single()

      if (urlError) throw urlError
      setUrl(urlData)

      // Load analysis results
      const { data: resultsData, error: resultsError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('url_id', id)
        .order('created_at', { ascending: false })

      if (resultsError) throw resultsError
      setResults(resultsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">URL Not Found</h1>
          <Link to="/urls" className="text-blue-600 hover:text-blue-500">
            ← Back to URLs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link to="/urls" className="text-blue-600 hover:text-blue-500 text-sm">
          ← Back to URLs
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">{url.name || cleanUrl(url.url)}</h1>
        <p className="text-gray-500">{cleanUrl(url.url)}</p>
        {url.description && (
          <p className="text-gray-600 mt-1">{url.description}</p>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results Yet</h3>
          <p className="text-gray-500 mb-4">
            Run an analysis from the URLs page to see results here
          </p>
          <Link
            to="/urls"
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-blue-500"
          >
            Go to URLs Page
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white shadow rounded-lg p-6">
              {/* Result Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Analysis Result
                  </h3>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(result.created_at).toLocaleString()}
                </div>
              </div>

              {result.success ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">📄 Page Info</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Title:</span>
                        <p className="text-gray-900">{result.title || 'No title'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Description:</span>
                        <p className="text-gray-900">{result.description || 'No description'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-1 ${result.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Load Time:</span>
                        <span className="ml-1 text-gray-900">{result.load_time}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">🔍 Content</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">H1 Tags:</span>
                        <span className="text-gray-900">{result.h1_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">H2 Tags:</span>
                        <span className="text-gray-900">{result.h2_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Images:</span>
                        <span className="text-gray-900">{result.images_total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Images w/o Alt:</span>
                        <span className={`${(result.images_without_alt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {result.images_without_alt || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Links:</span>
                        <span className="text-gray-900">{result.links_total || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Size & Performance */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">⚡ Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Word Count:</span>
                        <span className="text-gray-900">{result.word_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">HTML Size:</span>
                        <span className="text-gray-900">
                          {result.html_size ? `${Math.round(result.html_size / 1024)} KB` : '0 KB'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Load Time:</span>
                        <span className={`${result.load_time > 3000 ? 'text-red-600' : result.load_time > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {result.load_time}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-red-500 text-lg mb-2">❌ Analysis Failed</div>
                  <p className="text-gray-600">{result.error_message || 'Unknown error occurred'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
