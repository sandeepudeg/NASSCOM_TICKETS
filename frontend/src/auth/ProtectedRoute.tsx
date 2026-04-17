import { Navigate } from 'react-router-dom'
import { isAuthenticated } from './tokenStorage'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Bypass auth for local development
  if (import.meta.env.DEV) {
    return <>{children}</>
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
