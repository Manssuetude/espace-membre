import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface BlockGuestRouteProps {
  children: React.ReactNode
}

/**
 * Component that blocks guest users from accessing certain routes
 * Redirects guests to sessions page
 */
const BlockGuestRoute = ({ children }: BlockGuestRouteProps) => {
  const { user, isLoading } = useAuth()

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

  // Block guests - redirect them to sessions page
  if (user?.role === 'guest') {
    return <Navigate to="/sessions" replace />
  }

  return <>{children}</>
}

export default BlockGuestRoute
