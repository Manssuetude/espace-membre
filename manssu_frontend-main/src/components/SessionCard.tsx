import { Link } from 'react-router-dom'

interface SessionCardProps {
  id?: number | string
  day: number
  month: string
  title: string
  time: string
  location: string
  participants?: string
  status?: 'registered' | 'available'
  description?: string
  facilitator?: string
  facilitatorAvatar?: string
  color?: 'primary' | 'accent' | 'secondary' | 'success'
  onRegister?: (sessionId: string) => void
  isRegistering?: boolean
  isPastSession?: boolean
}

const colorClasses = {
  primary: 'from-primary to-red-500 shadow-red-500/30',
  accent: 'from-accent to-blue-600 shadow-accent/30',
  secondary: 'from-secondary to-orange-600 shadow-secondary/30',
  success: 'from-success to-emerald-600 shadow-success/30',
}

const SessionCard = ({
  id,
  day,
  month: _month,
  title,
  time,
  location,
  participants,
  status,
  description: _description,
  facilitator: _facilitator,
  facilitatorAvatar: _facilitatorAvatar,
  color = 'primary',
  onRegister,
  isRegistering = false,
  isPastSession = false,
}: SessionCardProps) => {
  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (id && onRegister && !isPastSession) {
      onRegister(String(id))
    }
  }
  const cardContent = (
    <>
      <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colorClasses[color]} rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}>
        {day}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h4>
        <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
          <i className="fa-solid fa-clock mr-2 text-primary"></i>
          <span className="truncate">{time}</span>
        </p>
        <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
          <i className={`fa-solid ${location.includes('En ligne') ? 'fa-video' : 'fa-location-dot'} mr-2 ${color === 'accent' ? 'text-accent' : 'text-secondary'} flex-shrink-0`}></i>
          <span className="truncate">{location}</span>
        </p>
        {participants && (
          <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
            <i className="fa-solid fa-users mr-2 text-accent flex-shrink-0"></i>
            <span>{participants}</span>
          </p>
        )}
      </div>
      {status === 'registered' ? (
        <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-success to-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-success/30 whitespace-nowrap flex-shrink-0">
          Inscrit
        </span>
      ) : (
        <button 
          className={`px-3 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r ${colorClasses[color]} text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleRegister}
          disabled={isRegistering || isPastSession || !onRegister}
        >
          {isRegistering ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-1"></i>
              Inscription...
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
      )}
    </>
  )

  if (id) {
    return (
      <Link
        to={`/sessions/${id}`}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-all">
      {cardContent}
    </div>
  )
}

export default SessionCard

