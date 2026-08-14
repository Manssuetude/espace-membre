import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserAvatarUrl, getUserInitials, getUserDisplayName } from '../utils/userUtils'

interface HeaderProps {
  title?: string
  subtitle?: string
  onMenuClick?: () => void
}

const Header = ({ title = 'Tableau de bord', subtitle = 'Bienvenue dans votre espace membre', onMenuClick }: HeaderProps) => {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  const avatarUrl = getUserAvatarUrl(user)
  const initials = getUserInitials(user)
  const displayName = getUserDisplayName(user)
  const userRole = 
    user?.role === 'admin' || user?.role === 'super_admin' 
      ? 'Administrateur' 
      : user?.role === 'guest' 
      ? 'Invité' 
      : 'Membre actif'

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Only apply scroll behavior on mobile (screens smaller than lg)
      if (window.innerWidth < 1024) {
        // Show header when scrolling up or at the top
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsVisible(true)
        } 
        // Hide header when scrolling down (but not at the very top)
        else if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsVisible(false)
        }
      } else {
        // Always visible on desktop
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header 
      className={`bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-8 py-6 lg:py-4 shadow-sm transition-transform duration-300 ease-in-out ${
        isVisible 
          ? 'translate-y-0' 
          : '-translate-y-full'
      } fixed top-0 left-0 right-0 lg:left-64 z-30`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              {title}
            </h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Link to="/profil" className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-semibold text-sm lg:text-base ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-gray-900">{displayName}</p>
              <p className="text-gray-500">{userRole}</p>
            </div>
          </Link>
        </div>
        </div>
    </header>
  )
}

export default Header

