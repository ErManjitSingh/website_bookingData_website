import { createContext, useContext, useState, useEffect } from 'react'
import { STATIC_USER, AUTH_STORAGE_KEY } from '../constants/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = (mobile, password) => {
    if (mobile === STATIC_USER.mobile && password === STATIC_USER.password) {
      const session = { name: STATIC_USER.name, mobile: STATIC_USER.mobile }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      setUser(session)
      return { success: true }
    }
    return { success: false, error: 'Invalid mobile number or password' }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
