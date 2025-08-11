import React, { useState, useEffect } from 'react'
import { db } from '../lib/supabase-simple'
import toast from 'react-hot-toast'

// Clean URL display function - remove protocol and www for cooler look
const cleanUrl = (url) => {
  if (!url) return url
  
  return url
    .replace(/^https?:\/\//, '') // Remove http:// or https://
    .replace(/^www\./, '')       // Remove www.
}

export default function URLs() {
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    loadUrls()
  }, [])

  const loadUrls = async () => {
    try {
      const { data, error } = await db.getUrls()
      if (error) throw error
      setUrls(data)
    } catch (error) {
      console.error('Error loading URLs:', error)
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
      await db.addUrl(formData.url, formData.name, formData.description)
      toast.success('URL added successfully!')
      setFormData({ url: '', name: '', description: '' })
      setShowForm(false)
      loadUrls()
    } catch (error) {
      console.error('Error adding URL:', error)
      toast.error('Failed to add URL')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading URLs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">🔗 URL Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add and manage the websites you want to analyze
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 active:bg-blue-600 disabled:opacity-25 transition"
          >
            {showForm ? 'Cancel' : 'Add URL'}
          </button>
        </div>
      </div>

      {/* Add URL Form */}
      {showForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New URL</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL *
              </label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Website"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500"
              >
                Add URL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* URLs List */}
      <div className="mt-8">
        {urls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No URLs added yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first website to analyze</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500"
            >
              Add Your First URL
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {urls.map((url) => (
                <li key={url.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            <a href={url.url} target="_blank" rel="noopener noreferrer">
                              {url.name || cleanUrl(url.url)}
                            </a>
                          </p>
                          <p className="text-sm text-gray-500 truncate">{cleanUrl(url.url)}</p>
                          {url.description && (
                            <p className="text-sm text-gray-500 mt-1">{url.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
