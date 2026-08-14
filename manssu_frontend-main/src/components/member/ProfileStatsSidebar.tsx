import { useMemo } from 'react'
import { useSessions } from '../../services/hooks/useSessions'
import { useMyFeedbacks } from '../../services/hooks/useFeedback'
import { useThemes } from '../../services/hooks/useThemes'
import { useAuth } from '../../contexts/AuthContext'

const ProfileStatsSidebar = () => {
  const { user } = useAuth()
  const userId = user?.id

  // Fetch sessions where user is registered
  const { data: sessionsData } = useSessions({})
  const sessions = sessionsData?.data || []

  // Count sessions where user is registered
  const sessionsParticipated = useMemo(() => {
    if (!userId) return 0
    return sessions.filter(session => session.isRegistered === true).length
  }, [sessions, userId])

  // Fetch user's feedbacks
  const { data: feedbacksData } = useMyFeedbacks({})
  const feedbacks = feedbacksData?.data || []
  const feedbacksCount = feedbacks.length

  // Fetch themes proposed by user
  const { data: themesData } = useThemes({})
  const themes = themesData?.data || []
  
  // Count themes proposed by the current user
  const themesProposed = useMemo(() => {
    if (!userId) return 0
    return themes.filter(theme => theme.submittedBy?.id === userId).length
  }, [themes, userId])

  const stats = [
    { 
      icon: 'fa-calendar-check', 
      label: 'Sessions participées', 
      value: sessionsParticipated.toString(), 
      color: 'accent' as const, 
      bgClass: 'from-accent/10 to-blue-600/10', 
      textClass: 'text-accent', 
      iconClass: 'text-accent' 
    },
    { 
      icon: 'fa-comment-dots', 
      label: 'Feedbacks envoyés', 
      value: feedbacksCount.toString(), 
      color: 'primary' as const, 
      bgClass: 'from-primary/10 to-red-500/10', 
      textClass: 'text-primary', 
      iconClass: 'text-primary' 
    },
    { 
      icon: 'fa-lightbulb', 
      label: 'Thèmes proposés', 
      value: themesProposed.toString(), 
      color: 'secondary' as const, 
      bgClass: 'from-secondary/10 to-orange-600/10', 
      textClass: 'text-secondary', 
      iconClass: 'text-secondary' 
    },
  ]

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center justify-between p-3 bg-gradient-to-r ${stat.bgClass} rounded-xl`}
          >
            <div className="flex items-center">
              <i className={`fa-solid ${stat.icon} ${stat.iconClass} mr-3`}></i>
              <span className="text-sm font-medium text-gray-700">{stat.label}</span>
            </div>
            <span className={`font-bold ${stat.textClass}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProfileStatsSidebar

