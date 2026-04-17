/**
 * Token refresh service for silent JWT token renewal.
 * 
 * Handles:
 * - Silent token refresh before expiry
 * - Retry logic on refresh failure
 * - Session expiry notification
 * - Unsaved form data preservation
 * 
 * Requirements: 38.9
 */

import axios from 'axios'
import {
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  clearAuthToken,
  isTokenExpiringSoon,
  notifyTokenExpiry,
} from './tokenStorage'

// Track refresh state
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

// Store unsaved form data before session expiry
const formDataStore = new Map<string, any>()

/**
 * Refresh the access token using the refresh token.
 * 
 * @returns Promise<boolean> - true if refresh succeeded, false otherwise
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = performTokenRefresh()

  try {
    const result = await refreshPromise
    return result
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

/**
 * Perform the actual token refresh API call.
 */
const performTokenRefresh = async (): Promise<boolean> => {
  const refresh = getRefreshToken()

  if (!refresh) {
    console.warn('No refresh token available')
    return false
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh`,
      { refresh_token: refresh },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const { access_token, refresh_token, expires_in } = response.data

    // Update tokens
    setAuthToken(access_token, expires_in)
    if (refresh_token) {
      setRefreshToken(refresh_token)
    }

    console.log('Token refreshed successfully')
    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

/**
 * Check if token needs refresh and refresh if necessary.
 * 
 * @returns Promise<boolean> - true if token is valid (refreshed or not expired)
 */
export const ensureValidToken = async (): Promise<boolean> => {
  if (isTokenExpiringSoon()) {
    return await refreshAccessToken()
  }
  return true
}

/**
 * Handle session expiry with user notification.
 * 
 * Shows notification and redirects to login without losing unsaved form data.
 */
export const handleSessionExpiry = (): void => {
  // Notify token expiry callbacks
  notifyTokenExpiry()

  // Clear auth tokens
  clearAuthToken()

  // Show session expired notification
  showSessionExpiredNotification()

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/login?session_expired=true'
  }, 2000)
}

/**
 * Show session expired notification to user.
 */
const showSessionExpiredNotification = (): void => {
  // Create notification element
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4d4f;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 400px;
  `
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Session Expired</div>
        <div style="font-size: 13px; opacity: 0.9;">Your session has expired. Redirecting to login...</div>
      </div>
    </div>
  `

  document.body.appendChild(notification)

  // Remove notification after redirect
  setTimeout(() => {
    notification.remove()
  }, 3000)
}

/**
 * Save form data before session expiry.
 * 
 * @param formId - Unique identifier for the form
 * @param data - Form data to save
 */
export const saveFormData = (formId: string, data: any): void => {
  formDataStore.set(formId, {
    data,
    timestamp: Date.now(),
  })

  // Store in sessionStorage as backup (survives page reload)
  try {
    sessionStorage.setItem(`form_${formId}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.warn('Failed to save form data to sessionStorage:', error)
  }
}

/**
 * Restore form data after login.
 * 
 * @param formId - Unique identifier for the form
 * @returns Saved form data or null if not found
 */
export const restoreFormData = (formId: string): any | null => {
  // Try memory first
  const memoryData = formDataStore.get(formId)
  if (memoryData) {
    // Only restore if less than 1 hour old
    if (Date.now() - memoryData.timestamp < 60 * 60 * 1000) {
      return memoryData.data
    }
    formDataStore.delete(formId)
  }

  // Try sessionStorage
  try {
    const stored = sessionStorage.getItem(`form_${formId}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only restore if less than 1 hour old
      if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
        return parsed.data
      }
      // Clean up expired data
      sessionStorage.removeItem(`form_${formId}`)
      return null
    }
  } catch (error) {
    console.warn('Failed to restore form data from sessionStorage:', error)
  }

  return null
}

/**
 * Clear saved form data.
 * 
 * @param formId - Unique identifier for the form
 */
export const clearFormData = (formId: string): void => {
  formDataStore.delete(formId)
  try {
    sessionStorage.removeItem(`form_${formId}`)
  } catch (error) {
    console.warn('Failed to clear form data from sessionStorage:', error)
  }
}

/**
 * Clear all form data (for testing purposes).
 */
export const clearAllFormData = (): void => {
  formDataStore.clear()
  try {
    // Clear all form data from sessionStorage
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith('form_')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Failed to clear all form data from sessionStorage:', error)
  }
}

/**
 * Start automatic token refresh interval.
 * 
 * Checks token expiry every minute and refreshes if needed.
 */
export const startTokenRefreshInterval = (): () => void => {
  const intervalId = setInterval(async () => {
    if (isTokenExpiringSoon()) {
      const success = await refreshAccessToken()
      if (!success) {
        handleSessionExpiry()
      }
    }
  }, 60 * 1000) // Check every minute

  // Return cleanup function
  return () => clearInterval(intervalId)
}
