/**
 * Unit tests for token refresh functionality.
 * 
 * Requirements: 38.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import {
  refreshAccessToken,
  ensureValidToken,
  saveFormData,
  restoreFormData,
  clearFormData,
  clearAllFormData,
} from '../tokenRefresh'
import {
  setAuthToken,
  setRefreshToken,
  getAuthToken,
  clearAuthToken,
} from '../tokenStorage'

// Mock axios
vi.mock('axios')

describe('Token Refresh', () => {
  beforeEach(() => {
    // Clear tokens before each test
    clearAuthToken()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      // Setup
      setRefreshToken('valid-refresh-token')
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 900, // 15 minutes
        },
      }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      // Execute
      const result = await refreshAccessToken()

      // Verify
      expect(result).toBe(true)
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refresh_token: 'valid-refresh-token' },
        expect.any(Object)
      )
      expect(getAuthToken()).toBe('new-access-token')
    })

    it('should return false when refresh token is missing', async () => {
      // Execute
      const result = await refreshAccessToken()

      // Verify
      expect(result).toBe(false)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should return false when refresh fails', async () => {
      // Setup
      setRefreshToken('invalid-refresh-token')
      vi.mocked(axios.post).mockRejectedValue(new Error('Unauthorized'))

      // Execute
      const result = await refreshAccessToken()

      // Verify
      expect(result).toBe(false)
    })

    it('should handle concurrent refresh requests', async () => {
      // Setup
      setRefreshToken('valid-refresh-token')
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 900,
        },
      }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      // Execute - trigger multiple refreshes simultaneously
      const results = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ])

      // Verify - should only call API once
      expect(results).toEqual([true, true, true])
      expect(axios.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('ensureValidToken', () => {
    it('should not refresh when token is not expiring soon', async () => {
      // Setup - token expires in 10 minutes
      setAuthToken('valid-token', 600)
      setRefreshToken('refresh-token')

      // Execute
      const result = await ensureValidToken()

      // Verify
      expect(result).toBe(true)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should refresh when token is expiring soon', async () => {
      // Setup - token expires in 1 minute (less than 2 minute threshold)
      setAuthToken('expiring-token', 60)
      setRefreshToken('refresh-token')
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 900,
        },
      }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      // Execute
      const result = await ensureValidToken()

      // Verify
      expect(result).toBe(true)
      expect(axios.post).toHaveBeenCalled()
    })
  })

  describe('Form Data Persistence', () => {
    beforeEach(() => {
      // Clear sessionStorage and in-memory store
      sessionStorage.clear()
      clearAllFormData()
    })

    it('should save and restore form data', () => {
      // Setup
      const formId = 'test-form'
      const formData = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'high',
      }

      // Execute
      saveFormData(formId, formData)
      const restored = restoreFormData(formId)

      // Verify
      expect(restored).toEqual(formData)
    })

    it('should not restore expired form data', () => {
      // Setup
      const formId = 'test-form'
      const formData = { title: 'Old Ticket' }
      
      // Save with old timestamp
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
      sessionStorage.setItem(`form_${formId}`, JSON.stringify({
        data: formData,
        timestamp: oldTimestamp,
      }))

      // Execute
      const restored = restoreFormData(formId)

      // Verify
      expect(restored).toBeNull()
    })

    it('should clear form data', () => {
      // Setup
      const formId = 'test-form'
      const formData = { title: 'Test' }
      saveFormData(formId, formData)

      // Execute
      clearFormData(formId)
      const restored = restoreFormData(formId)

      // Verify
      expect(restored).toBeNull()
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Setup - mock sessionStorage to throw error
      const originalSetItem = sessionStorage.setItem
      sessionStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      // Execute - should not throw
      expect(() => {
        saveFormData('test-form', { data: 'test' })
      }).not.toThrow()

      // Cleanup
      sessionStorage.setItem = originalSetItem
    })
  })
})
