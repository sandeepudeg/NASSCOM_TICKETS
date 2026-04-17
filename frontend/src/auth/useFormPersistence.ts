/**
 * React hook for form data persistence across session expiry.
 * 
 * Automatically saves form data and restores it after login.
 * 
 * Requirements: 38.9
 */

import { useEffect, useCallback } from 'react'
import { saveFormData, restoreFormData, clearFormData } from './tokenRefresh'

/**
 * Hook to persist form data across session expiry.
 * 
 * @param formId - Unique identifier for the form
 * @param formData - Current form data to persist
 * @param enabled - Whether to enable persistence (default: true)
 * @returns Object with restore and clear functions
 */
export const useFormPersistence = <T = any>(
  formId: string,
  formData: T,
  enabled: boolean = true
) => {
  // Save form data on change
  useEffect(() => {
    if (enabled && formData) {
      // Debounce saves to avoid excessive writes
      const timeoutId = setTimeout(() => {
        saveFormData(formId, formData)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [formId, formData, enabled])

  // Restore form data on mount
  const restore = useCallback((): T | null => {
    if (enabled) {
      return restoreFormData(formId)
    }
    return null
  }, [formId, enabled])

  // Clear form data
  const clear = useCallback(() => {
    clearFormData(formId)
  }, [formId])

  return { restore, clear }
}

/**
 * Hook to restore form data on component mount.
 * 
 * @param formId - Unique identifier for the form
 * @returns Restored form data or null
 */
export const useFormRestore = <T = any>(formId: string): T | null => {
  const restored = restoreFormData(formId)
  
  // Clear after restore to avoid stale data
  useEffect(() => {
    if (restored) {
      // Clear after a short delay to ensure form has been populated
      const timeoutId = setTimeout(() => {
        clearFormData(formId)
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [formId, restored])

  return restored
}
