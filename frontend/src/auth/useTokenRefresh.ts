/**
 * React hook for automatic token refresh.
 * 
 * Integrates token refresh service with React component lifecycle.
 * 
 * Requirements: 38.9
 */

import { useEffect } from 'react'
import { startTokenRefreshInterval } from './tokenRefresh'

/**
 * Hook to enable automatic token refresh.
 * 
 * Should be used in the root App component or Layout component.
 * Automatically starts token refresh interval and cleans up on unmount.
 */
export const useTokenRefresh = () => {
  useEffect(() => {
    // Start token refresh interval
    const cleanup = startTokenRefreshInterval()

    // Cleanup on unmount
    return cleanup
  }, [])
}
