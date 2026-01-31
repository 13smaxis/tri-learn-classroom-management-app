import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import apiClient from '@/services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'teacher' | 'parent' | 'learner'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'teacher' | 'parent' | 'learner'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('authToken')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const response = await apiClient.post('/api/auth/login', { email, password })
      const { user, token } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      throw new Error(message)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setError(null)
      const response = await apiClient.post('/api/auth/register', data)
      const { user, token } = response.data
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed'
      setError(message)
      throw new Error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
