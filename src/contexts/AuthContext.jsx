import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})
const CORRECT_PIN = '1905'
const AUTH_STORAGE_KEY = 'luna-auth-token'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authToken = localStorage.getItem(AUTH_STORAGE_KEY)
    if (authToken === CORRECT_PIN) {
      setUser({ id: 'pin-user', authenticated: true })
    }
    setLoading(false)
  }, [])

  const signInWithPin = async (pin) => {
    if (pin === CORRECT_PIN) {
      localStorage.setItem(AUTH_STORAGE_KEY, pin)
      setUser({ id: 'pin-user', authenticated: true })
      return { success: true, error: null }
    } else {
      return { success: false, error: { message: 'Invalid pin code' } }
    }
  }

  const signOut = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
    return { error: null }
  }

  const value = {
    user,
    loading,
    signInWithPin,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
