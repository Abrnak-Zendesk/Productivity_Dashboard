'use client'

import { useState, useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const authToken = sessionStorage.getItem('dashboard-auth')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check password against environment variable
    const correctPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'zendesk2024'

    if (password === correctPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('dashboard-auth', 'authenticated')
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zendesk-green"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zendesk-green flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full border-t-4 border-zendesk-lime">
          <div className="text-center mb-8">
            <img src="/zendesk-logo.png" alt="Zendesk Logo" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-zendesk-green mb-2">
              SMB Dashboards
            </h1>
            <p className="text-gray-600">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-zendesk-green mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zendesk-lime focus:border-zendesk-green transition-all"
                placeholder="Enter password"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-zendesk-green text-white py-3 rounded-lg font-bold hover:bg-zendesk-green-light transition-colors"
            >
              Access Dashboards
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
