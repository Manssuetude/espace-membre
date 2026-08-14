import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMemberDashboard } from '../../services/hooks/useDashboard'
import { useRegisterForSession } from '../../services/hooks/useSessions'
import StatCard from '../../components/StatCard'
import SessionCard from '../../components/SessionCard'
import QuickActionButton from '../../components/QuickActionButton'
import ResourceCard from '../../components/ResourceCard'
import { translateResourceType } from '../../utils/resourceUtils'
import CreateInvitationRequestModal from '../../components/member/CreateInvitationRequestModal'

const Dashboard = () => {
  const { data: dashboardData, isLoading } = useMemberDashboard()
  const registerForSession = useRegisterForSession()
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  const stats = dashboardData?.stats || {
    activeMembers: 0,
    sessionsCompleted: 0,
    newResources: 0,
    participationRate: 0,
  }

  const upcomingSessions = dashboardData?.upcomingSessions || []
  const activePolls = dashboardData?.activePolls || []
  const recentResources = dashboardData?.recentResources || []

  const handleRegister = (sessionId: string) => {
    registerForSession.mutate(sessionId)
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Membres actifs"
          value={String(stats.activeMembers)}
          icon="fa-users"
          color="primary"
        />
        <StatCard
          label="Sessions effectuées"
          value={String(stats.sessionsCompleted)}
          icon="fa-calendar-check"
          color="accent"
        />
        <StatCard
          label="Nouvelles ressources"
          value={String(stats.newResources)}
          icon="fa-book-open"
          color="secondary"
        />
        <StatCard
          label="Taux de participation"
          value={`${stats.participationRate}%`}
          icon="fa-chart-line"
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Prochaines Sessions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Prochaines sessions</h3>
              <Link to="/sessions" className="text-primary hover:text-primary/80 text-sm font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.slice(0, 2).map((session) => {
                  if (!session.date) {
                    return null
                  }
                  const sessionDate = new Date(session.date)
                  const day = sessionDate.getDate()
                  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                  const month = monthNames[sessionDate.getMonth()]
                  const weekdayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                  const weekday = weekdayNames[sessionDate.getDay()]
                  const timeStr = `${weekday} ${day} ${month} • ${session.startTime || ''} - ${session.endTime || ''}`
                  
                  // Convert location to string
                  const locationStr = session.location?.address || 'Non défini'
                  
                  const isPastSession = session.status === 'completed' || 
                    (session.date ? new Date(session.date) < new Date() : false)

                  return (
                    <SessionCard
                      key={session.id}
                      id={session.id}
                      day={day}
                      month={month}
                      title={session.title}
                      time={timeStr}
                      location={locationStr}
                      participants={`${session.registered}/${session.maxParticipants}`}
                      status={session.isRegistered ? 'registered' : 'available'}
                      color="primary"
                      onRegister={handleRegister}
                      isRegistering={registerForSession.isPending}
                      isPastSession={isPastSession}
                    />
                  )
                }).filter(Boolean)
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-calendar-xmark text-primary text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucune session à venir</p>
                  <p className="text-gray-400 text-xs">Les prochaines sessions seront affichées ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Sondages Actifs */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sondages actifs</h3>
              <Link to="/sondages" className="text-primary hover:text-primary/80 text-sm font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-4">
              {activePolls.length > 0 ? (
                activePolls.map((poll) => {
                  const formatEndDate = (dateStr?: string | null) => {
                    if (!dateStr) return ''
                    const date = new Date(dateStr)
                    return date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  }
                  
                  return (
                  <Link
                    key={poll.id}
                    to="/sondages"
                    className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {poll.title}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center">
                          <i className="fa-solid fa-users mr-2 text-accent"></i>
                          {poll.totalResponses} réponses
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all">
                        Participer
                      </span>
                    </div>
                    {poll.daysLeft !== undefined && poll.daysLeft !== null && (
                      <div className="flex items-center text-xs text-gray-500">
                        <i className="fa-solid fa-clock mr-1"></i>
                        {poll.daysLeft === 0 
                          ? 'Dernier jour pour voter'
                          : poll.daysLeft < 0
                          ? `Terminé le ${formatEndDate(poll.endDate)}`
                          : `Se termine dans ${poll.daysLeft} jour${poll.daysLeft > 1 ? 's' : ''}`
                        }
                      </div>
                    )}
                  </Link>
                )
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-square-poll-vertical text-accent text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucun sondage actif</p>
                  <p className="text-gray-400 text-xs">Aucun sondage n'est actuellement en cours</p>
                </div>
              )}
            </div>
          </div>

          {/* Propositions de thèmes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Propositions de thèmes</h3>
            </div>
            {dashboardData?.themeWindow?.isOpen ? (
              <Link
                to="/proposer-theme"
                className="p-4 sm:p-5 border-2 border-dashed border-secondary/30 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 hover:border-secondary/50 transition-all block"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center flex-1">
                    <div className="hidden sm:flex w-12 h-12 bg-gradient-to-br from-secondary to-orange-600 rounded-xl items-center justify-center mr-4 shadow-lg shadow-secondary/30 flex-shrink-0">
                      <i className="fa-solid fa-lightbulb text-white text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Fenêtre de propositions ouverte</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Proposez vos idées de thèmes pour les prochaines sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Fermeture dans</p>
                    <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-secondary to-orange-600 bg-clip-text text-transparent">
                      {dashboardData.themeWindow.daysUntilClose || 0} jours
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-lock text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">Fenêtre de propositions fermée</p>
                <p className="text-gray-400 text-xs">La fenêtre de propositions de thèmes est actuellement fermée</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Actions Rapides */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <QuickActionButton
                icon="fa-comment-dots"
                label="Envoyer un feedback"
                color="primary"
                to="/feedback"
              />
              <QuickActionButton
                icon="fa-calendar-days"
                label="Voir les sessions"
                color="accent"
                to="/sessions"
              />
              <QuickActionButton
                icon="fa-lightbulb"
                label="Proposer un thème"
                color="secondary"
                to="/proposer-theme"
              />
              <QuickActionButton
                icon="fa-user-plus"
                label="Inviter un membre"
                color="accent"
                onClick={() => setShowInviteModal(true)}
              />
            </div>
          </div>

          {/* Dernières Ressources */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dernières ressources</h3>
              <Link to="/ressources" className="text-primary hover:text-primary/80 text-sm font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {recentResources.length > 0 ? (
                recentResources.slice(0, 3).map((resource) => {
                  const iconMap: Record<string, string> = {
                    file: 'fa-file-pdf',
                    video: 'fa-video',
                    audio: 'fa-podcast',
                    folder: 'fa-folder',
                  }
                  const colorMap: Record<string, 'primary' | 'accent' | 'secondary'> = {
                    file: 'primary',
                    video: 'accent',
                    audio: 'secondary',
                    folder: 'secondary',
                  }
                  
                  return (
                    <ResourceCard
                      key={resource.id}
                      icon={iconMap[resource.type] || 'fa-file'}
                      title={resource.title}
                      type={resource.category || translateResourceType(resource.type)}
                      color={colorMap[resource.type] || 'primary'}
                      to="/ressources"
                    />
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary/10 to-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-folder-open text-secondary text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucune ressource récente</p>
                  <p className="text-gray-400 text-xs">Les nouvelles ressources apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateInvitationRequestModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => setShowInviteModal(false)}
      />
    </div>
  )
}

export default Dashboard

