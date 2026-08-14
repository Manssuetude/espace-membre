import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'member' | 'admin'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (requiredRole) {
    // For admin routes, allow both 'admin' and 'super_admin' roles
    if (requiredRole === 'admin') {
      if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        // Member or guest trying to access admin route - redirect to member dashboard
        return <Navigate to="/" replace />
      }
    } else if (requiredRole === 'member') {
      // For member routes, allow all authenticated users (members, admins, super_admins, guests)
      // Admins and super_admins can access member space
      // Guests can access member space (they're registered for specific sessions)
      // This is already satisfied by the authentication check above
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

