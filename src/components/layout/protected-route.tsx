import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'
import { Alert, AlertDescription } from '../ui/alert'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Alert className="w-full max-w-sm">
          <AlertDescription>Loading session...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && role !== 'admin') {
    return (
      <Alert variant="destructive" className="mx-auto max-w-lg">
        <AlertDescription>You do not have permission to access this page.</AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
