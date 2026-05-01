import { Navigate } from 'react-router-dom'
import { isAuthenticated, getUserRole, getUserId } from './tokenStorage'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const role = getUserRole()
  const userId = getUserId()

  if (role !== 'admin' && userId !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
