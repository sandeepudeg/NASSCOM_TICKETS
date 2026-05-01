import { create } from 'zustand'
import { authApi } from './authApi'
import { isAuthenticated, clearAuthToken } from './tokenStorage'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: isAuthenticated(),
  isLoading: false,
  username: localStorage.getItem('auth_username'),
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.login({ username, password })
      localStorage.setItem('auth_username', username)
      set({ isAuthenticated: true, isLoading: false, username })
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed'
      set({ isAuthenticated: false, isLoading: false, error: errorMessage, username: null })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } finally {
      clearAuthToken()
      localStorage.removeItem('auth_username')
      set({ isAuthenticated: false, isLoading: false, error: null, username: null })
    }
  },

  checkAuth: () => {
    const isAuth = isAuthenticated()
    const username = localStorage.getItem('auth_username')
    set({ isAuthenticated: isAuth, username: isAuth ? username : null })
  },
}))
