import { getUserAvatarUrl, getUserInitials } from '../utils/userUtils'
import { User } from '../types/auth'

interface ProfileHeaderCardProps {
  user: User | null
  memberSince: string
  sessionsCount: number
  status: string
}

const ProfileHeaderCard = ({ user, memberSince, sessionsCount, status }: ProfileHeaderCardProps) => {
  const avatarUrl = getUserAvatarUrl(user)
  const initials = getUserInitials(user)
  const displayName = user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Utilisateur')
  
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 mb-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
        <div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/20 shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-bold text-4xl ring-4 ring-primary/20 shadow-xl">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h2>
          <p className="text-lg text-gray-600 mb-4">Membre depuis {memberSince}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6">
            <div className="flex items-center text-sm text-gray-500">
              <i className="fa-solid fa-calendar mr-2 text-accent"></i>
              {sessionsCount} sessions participées
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <i className="fa-solid fa-star mr-2 text-warning"></i>
              {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeaderCard

