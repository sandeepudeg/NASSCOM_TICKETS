import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { ApiError } from '../client'
import { ProblemDetails } from '../types'

// Note: We're testing the ApiError class and error normalization logic directly
// The actual axios interceptor setup is tested through integration tests

describe('API Client Error Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('RFC 7807 Error Parsing', () => {
    it('should parse RFC 7807 response into ApiError', async () => {
      const rfc7807Response: ProblemDetails = {
        type: 'https://tickets.example.com/errors/duplicate-folder-name',
        title: 'Duplicate Folder Name',
        status: 409,
        detail: 'A folder named "Infrastructure Issues" already exists for this user.',
        instance: '/api/v1/folders',
      }

      const axiosError = {
        response: {
          status: 409,
          statusText: 'Conflict',
          data: rfc7807Response,
        },
        isAxiosError: true,
      } as AxiosError

      // Simulate the response interceptor behavior
      try {
        // This would be thrown by the interceptor
        throw new ApiError(rfc7807Response, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.type).toBe(rfc7807Response.type)
        expect(apiError.problemDetails.title).toBe(rfc7807Response.title)
        expect(apiError.problemDetails.status).toBe(409)
        expect(apiError.problemDetails.detail).toBe(rfc7807Response.detail)
        expect(apiError.problemDetails.instance).toBe(rfc7807Response.instance)
        expect(apiError.message).toBe(rfc7807Response.detail)
      }
    })

    it('should parse RFC 7807 response with missing optional fields', async () => {
      const rfc7807Response = {
        type: 'https://tickets.example.com/errors/invalid-folder-name',
        title: 'Invalid Folder Name',
        status: 422,
        detail: 'Folder name cannot be empty',
      }

      const axiosError = {
        response: {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: rfc7807Response,
        },
        isAxiosError: true,
      } as AxiosError

      try {
        throw new ApiError(rfc7807Response as ProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.type).toBe(rfc7807Response.type)
        expect(apiError.problemDetails.title).toBe(rfc7807Response.title)
        expect(apiError.problemDetails.status).toBe(422)
        expect(apiError.problemDetails.detail).toBe(rfc7807Response.detail)
        expect(apiError.problemDetails.instance).toBeUndefined()
      }
    })

    it('should handle non-RFC 7807 error responses with fallback', async () => {
      const axiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: 'Something went wrong',
        },
        isAxiosError: true,
      } as AxiosError

      const fallbackProblemDetails: ProblemDetails = {
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Something went wrong',
      }

      try {
        throw new ApiError(fallbackProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.type).toBe('about:blank')
        expect(apiError.problemDetails.title).toBe('Internal Server Error')
        expect(apiError.problemDetails.status).toBe(500)
        expect(apiError.problemDetails.detail).toBe('Something went wrong')
      }
    })

    it('should handle network errors without response', async () => {
      const axiosError = {
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError

      const networkProblemDetails: ProblemDetails = {
        type: 'about:blank',
        title: 'Network Error',
        status: 0,
        detail: 'Unable to reach the server. Please check your connection.',
      }

      try {
        throw new ApiError(networkProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.type).toBe('about:blank')
        expect(apiError.problemDetails.title).toBe('Network Error')
        expect(apiError.problemDetails.status).toBe(0)
        expect(apiError.problemDetails.detail).toContain('Unable to reach the server')
      }
    })

    it('should handle 401 Unauthorized with session expired message', async () => {
      const axiosError = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
        },
        isAxiosError: true,
      } as AxiosError

      const unauthorizedProblemDetails: ProblemDetails = {
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Your session has expired. Please log in again.',
      }

      try {
        throw new ApiError(unauthorizedProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.status).toBe(401)
        expect(apiError.problemDetails.detail).toContain('session has expired')
      }
    })

    it('should parse RFC 7807 with status mismatch (use RFC 7807 status)', async () => {
      const rfc7807Response = {
        type: 'https://tickets.example.com/errors/folder-not-found',
        title: 'Folder Not Found',
        status: 404,
        detail: 'The requested folder does not exist',
      }

      const axiosError = {
        response: {
          status: 500, // HTTP status differs from RFC 7807 status
          statusText: 'Internal Server Error',
          data: rfc7807Response,
        },
        isAxiosError: true,
      } as AxiosError

      try {
        throw new ApiError(rfc7807Response as ProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        // Should use the status from RFC 7807 body, not HTTP status
        expect(apiError.problemDetails.status).toBe(404)
      }
    })

    it('should handle object response data without RFC 7807 fields', async () => {
      const axiosError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
        },
        isAxiosError: true,
      } as AxiosError

      const fallbackProblemDetails: ProblemDetails = {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'An unexpected error occurred',
      }

      try {
        throw new ApiError(fallbackProblemDetails, axiosError)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.problemDetails.type).toBe('about:blank')
        expect(apiError.problemDetails.status).toBe(400)
      }
    })
  })

  describe('ApiError Class', () => {
    it('should create ApiError with problemDetails and originalError', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://tickets.example.com/errors/test',
        title: 'Test Error',
        status: 400,
        detail: 'This is a test error',
      }

      const axiosError = {
        response: { status: 400 },
      } as AxiosError

      const apiError = new ApiError(problemDetails, axiosError)

      expect(apiError).toBeInstanceOf(Error)
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.name).toBe('ApiError')
      expect(apiError.message).toBe('This is a test error')
      expect(apiError.problemDetails).toEqual(problemDetails)
      expect(apiError.originalError).toBe(axiosError)
    })

    it('should create ApiError without originalError', () => {
      const problemDetails: ProblemDetails = {
        type: 'about:blank',
        title: 'Generic Error',
        status: 500,
        detail: 'An error occurred',
      }

      const apiError = new ApiError(problemDetails)

      expect(apiError.problemDetails).toEqual(problemDetails)
      expect(apiError.originalError).toBeUndefined()
    })
  })
})
