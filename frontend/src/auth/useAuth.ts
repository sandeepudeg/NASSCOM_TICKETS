import { create } from 'zustand'
import { authApi } from './authApi'
import { isAuthenticated, clearAuthToken } from './tokenStorage'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.login({ username, password })
      set({ isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed'
      set({ isAuthenticated: false, isLoading: false, error: errorMessage })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } finally {
      clearAuthToken()
      set({ isAuthenticated: false, isLoading: false, error: null })
    }
  },

  checkAuth: () => {
    set({ isAuthenticated: isAuthenticated() })
  },
}))
