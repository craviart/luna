import React, { useState } from 'react'
import { Cloud, Globe, Zap } from 'lucide-react'

function App() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Millie Dashboard</h1>
            <Cloud className="h-6 w-6 text-blue-500" />
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
            <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🎉 Supabase Setup Required
            </h2>
            <p className="text-gray-600 text-sm">
              Your new cloud-powered dashboard is ready! Follow the setup guide to connect Supabase.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span className="text-sm text-gray-700">Create Supabase account</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-sm text-gray-700">Run database setup SQL</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="text-sm text-gray-700">Add environment variables</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ No more import errors!<br/>
              ✅ No more local database issues!<br/>
              ✅ Pure cloud-powered solution!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
