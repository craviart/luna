import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})
const AUTH_STORAGE_KEY = 'luna-auth-token'
const USER_ROLE_KEY = 'luna-user-role'

// Define user roles and their permissions
const USER_ROLES = {
  ADMIN: {
    pin: '2609',
    name: 'Admin',
    permissions: {
      viewApiMonitoring: true,
      addUrl: true,
      analyseAll: true,
      runAnalysis: true,
    }
  },
  VIEWER: {
    pin: '1905',
    name: 'Viewer', 
    permissions: {
      viewApiMonitoring: false,
      addUrl: false,
      analyseAll: false,
      runAnalysis: false,
    }
  }
}

// Helper function to get role by pin
const getRoleByPin = (pin) => {
  return Object.values(USER_ROLES).find(role => role.pin === pin)
}

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
    const userRole = localStorage.getItem(USER_ROLE_KEY)
    
    if (authToken && userRole) {
      const role = getRoleByPin(authToken)
      if (role && role.name === userRole) {
        setUser({ 
          id: 'pin-user', 
          authenticated: true, 
          role: role.name,
          permissions: role.permissions
        })
      } else {
        // Clear invalid stored data
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(USER_ROLE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const signInWithPin = async (pin) => {
    const role = getRoleByPin(pin)
    if (role) {
      localStorage.setItem(AUTH_STORAGE_KEY, pin)
      localStorage.setItem(USER_ROLE_KEY, role.name)
      setUser({ 
        id: 'pin-user', 
        authenticated: true, 
        role: role.name,
        permissions: role.permissions
      })
      return { success: true, error: null }
    } else {
      return { success: false, error: { message: 'Invalid pin code' } }
    }
  }

  const signOut = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_ROLE_KEY)
    setUser(null)
    return { error: null }
  }

  // Helper function to check if user has a specific permission
  const hasPermission = (permission) => {
    return user?.permissions?.[permission] === true
  }

  // Helper function to check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  const value = {
    user,
    loading,
    signInWithPin,
    signOut,
    hasPermission,
    hasRole,
    USER_ROLES, // Export roles for reference
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
