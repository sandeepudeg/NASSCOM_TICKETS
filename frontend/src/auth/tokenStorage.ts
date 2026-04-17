// In-memory token storage (not localStorage for security)
let authToken: string | null = null
let refreshToken: string | null = null
let tokenExpiresAt: number | null = null

// Callbacks for token expiry events
type TokenExpiryCallback = () => void
const tokenExpiryCallbacks: TokenExpiryCallback[] = []

export const getAuthToken = (): string | null => {
  return authToken
}

export const setAuthToken = (token: string, expiresIn?: number): void => {
  authToken = token
  
  // Calculate expiry time (default 15 minutes if not provided)
  if (expiresIn) {
    tokenExpiresAt = Date.now() + expiresIn * 1000
  } else {
    tokenExpiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes default
  }
}

export const getRefreshToken = (): string | null => {
  return refreshToken
}

export const setRefreshToken = (token: string): void => {
  refreshToken = token
}

export const clearAuthToken = (): void => {
  authToken = null
  refreshToken = null
  tokenExpiresAt = null
}

export const isAuthenticated = (): boolean => {
  return authToken !== null
}

export const isTokenExpired = (): boolean => {
  if (!tokenExpiresAt) return false
  return Date.now() >= tokenExpiresAt
}

export const isTokenExpiringSoon = (): boolean => {
  if (!tokenExpiresAt) return false
  // Consider token expiring soon if less than 2 minutes remaining
  return Date.now() >= tokenExpiresAt - 2 * 60 * 1000
}

export const onTokenExpiry = (callback: TokenExpiryCallback): void => {
  tokenExpiryCallbacks.push(callback)
}

export const notifyTokenExpiry = (): void => {
  tokenExpiryCallbacks.forEach(callback => callback())
}

