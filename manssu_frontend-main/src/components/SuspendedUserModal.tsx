import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const SuspendedUserModal = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.status === 'suspended') {
      // Auto logout after 3 seconds
      const timer = setTimeout(() => {
        logout()
        navigate('/auth/login')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [user, logout, navigate])

  if (user?.status !== 'suspended') {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-warning to-yellow-500 mb-4">
            <i className="fa-solid fa-ban text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Compte suspendu
          </h2>
          <p className="text-gray-600 mb-6">
            Votre compte a été suspendu. Veuillez contacter un administrateur pour plus d'informations.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Déconnexion en cours...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuspendedUserModal

