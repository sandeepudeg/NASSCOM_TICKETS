import axios from 'axios'
import { setAuthToken, setRefreshToken, setUserRole, setUserId, clearAuthToken, getRefreshToken } from './tokenStorage'

interface LoginRequest {
  username: string
  password: string
  tenant?: string
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  role: string
  user_id: string
  token_type: string
  expires_in: number
}

interface RefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
})

export const authApi = {
  // Login with username and password
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authClient.post<LoginResponse>('/auth/login', credentials)
    const { access_token, refresh_token, role, user_id } = response.data
    
    setAuthToken(access_token)
    setRefreshToken(refresh_token)
    setUserRole(role)
    setUserId(user_id)
    
    return response.data
  },

  // Refresh access token
  refresh: async (): Promise<RefreshResponse> => {
    const refresh = getRefreshToken()
    if (!refresh) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authClient.post<RefreshResponse>('/auth/refresh', {
        refresh_token: refresh,
      })
      
      const { access_token } = response.data
      setAuthToken(access_token)
      
      return response.data
    } catch (error) {
      // If refresh fails, clear tokens and force re-login
      clearAuthToken()
      throw error
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await authClient.post('/auth/logout')
    } finally {
      clearAuthToken()
    }
  },
}
