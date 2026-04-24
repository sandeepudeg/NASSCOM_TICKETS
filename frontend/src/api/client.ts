import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ProblemDetails } from './types'
import { getAuthToken } from '../auth/tokenStorage'
import { refreshAccessToken, handleSessionExpiry } from '../auth/tokenRefresh'

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshingToken = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve()
    }
  })
  failedQueue = []
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public problemDetails: ProblemDetails,
    public originalError?: AxiosError
  ) {
    super(problemDetails.detail)
    this.name = 'ApiError'
  }
}

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: 300000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - inject JWT token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAuthToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - normalize RFC 7807 errors and handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      // Handle network errors
      if (!error.response) {
        const problemDetails: ProblemDetails = {
          type: 'about:blank',
          title: 'Network Error',
          status: 0,
          detail: 'Unable to reach the server. Please check your connection.',
        }
        return Promise.reject(new ApiError(problemDetails, error))
      }

      // Handle 401 - attempt token refresh
      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshingToken) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(() => {
              // Retry original request with new token
              return client(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshingToken = true

        try {
          const refreshSuccess = await refreshAccessToken()

          if (refreshSuccess) {
            // Token refreshed successfully, retry all queued requests
            processQueue()
            isRefreshingToken = false

            // Retry the original request with new token
            const token = getAuthToken()
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return client(originalRequest)
          } else {
            // Refresh failed, handle session expiry
            processQueue(new Error('Token refresh failed'))
            isRefreshingToken = false
            handleSessionExpiry()

            const problemDetails: ProblemDetails = {
              type: 'about:blank',
              title: 'Session Expired',
              status: 401,
              detail: 'Your session has expired. Please log in again.',
            }
            return Promise.reject(new ApiError(problemDetails, error))
          }
        } catch (refreshError) {
          processQueue(refreshError)
          isRefreshingToken = false
          handleSessionExpiry()

          const problemDetails: ProblemDetails = {
            type: 'about:blank',
            title: 'Session Expired',
            status: 401,
            detail: 'Your session has expired. Please log in again.',
          }
          return Promise.reject(new ApiError(problemDetails, error))
        }
      }

      // Parse RFC 7807 response if available
      const data = error.response.data as any
      if (data && typeof data === 'object' && 'type' in data && 'title' in data) {
        const problemDetails: ProblemDetails = {
          type: data.type,
          title: data.title,
          status: data.status || error.response.status,
          detail: data.detail || 'An error occurred',
          instance: data.instance,
        }
        return Promise.reject(new ApiError(problemDetails, error))
      }

      // Fallback for non-RFC 7807 responses
      const problemDetails: ProblemDetails = {
        type: 'about:blank',
        title: error.response.statusText || 'Error',
        status: error.response.status,
        detail: typeof data === 'string' ? data : 'An unexpected error occurred',
      }
      return Promise.reject(new ApiError(problemDetails, error))
    }
  )

  return client
}

export const apiClient = createApiClient()
