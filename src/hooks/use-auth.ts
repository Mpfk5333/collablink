import { useEffect, useState, useCallback } from 'react'
import { authService } from '@/lib/api'
import { User } from '@/lib/types'

export interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    nom: string
    prenom: string
    email: string
    password: string
    role: 'client' | 'freelance'
  }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('api_token')
        if (token) {
          const response = await authService.me()
          setUser(response.data.data)
          setIsAuthenticated(true)
        }
      } catch (err) {
        localStorage.removeItem('api_token')
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await authService.login(email, password)
        const { token, user: userData } = response.data.data as { token: string; user: any }
        localStorage.setItem('api_token', token)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (err: any) {
        const message = err.response?.data?.message || 'Erreur de connexion'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const register = useCallback(
    async (data: {
      nom: string
      prenom: string
      email: string
      password: string
      role: 'client' | 'freelance'
    }) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await authService.register(data)
        const { token, user: userData } = response.data.data as { token: string; user: any }
        localStorage.setItem('api_token', token)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (err: any) {
        const message = err.response?.data?.message || "Erreur lors de l'enregistrement"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } finally {
      localStorage.removeItem('api_token')
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    clearError,
  }
}
