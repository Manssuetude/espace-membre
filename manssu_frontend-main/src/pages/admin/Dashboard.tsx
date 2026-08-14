import { Link } from 'react-router-dom'
import { useAdminDashboard } from '../../services/hooks/useDashboard'
import { useUpdateTheme } from '../../services/hooks/useThemes'
import { useUpdateResourceStatus } from '../../services/hooks/useResources'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../services/api/queryKeys'
import { translateResourceType } from '../../utils/resourceUtils'
import { formatDate } from '../../utils/dateUtils'

const Dashboard = () => {
  const { data: dashboardData, isLoading } = useAdminDashboard()
  const updateTheme = useUpdateTheme()
  const updateResourceStatus = useUpdateResourceStatus()
  const queryClient = useQueryClient()

  const handleApproveTheme = (themeId: string) => {
    updateTheme.mutate({
      id: themeId,
      data: { status: 'approved' },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      },
    })
  }

  const handleRejectTheme = (themeId: string) => {
    updateTheme.mutate({
      id: themeId,
      data: { status: 'rejected' },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      },
    })
  }

  const handleApproveResource = (resourceId: string) => {
    updateResourceStatus.mutate({
      id: resourceId,
      data: { status: 'approved' },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      },
    })
  }

  const handleRejectResource = (resourceId: string) => {
    updateResourceStatus.mutate({
      id: resourceId,
      data: { status: 'rejected' },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      },
    })
  }

  // Format time ago
  const formatTimeAgo = (dateStr: string | null) => {
    return formatDate(dateStr, { includeTime: false, showRelative: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  const stats = dashboardData?.stats || {
    pendingThemes: 0,
    pendingResources: 0,
    recentFeedbacks: 0,
    totalMembers: 0,
  }

  const pendingThemes = dashboardData?.pendingThemes || []
  const activePolls = dashboardData?.activePolls || []
  const pendingResources = dashboardData?.pendingResources || []
  const recentFeedbacks = dashboardData?.recentFeedbacks || []

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-warning/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thèmes en attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingThemes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning/10 to-yellow-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-clock text-warning text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-secondary/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ressources en attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingResources}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary/10 to-orange-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-circle-exclamation text-secondary text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-accent/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Feedbacks récents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentFeedbacks}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-message text-accent text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-success/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Membres totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success/10 to-emerald-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-users text-success text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Propositions de thèmes en attente */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fa-solid fa-lightbulb text-warning mr-2"></i>
                Propositions de thèmes en attente
              </h3>
              <span className="bg-gradient-to-r from-warning to-yellow-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">{stats.pendingThemes} en attente</span>
            </div>
            <div className="space-y-4">
              {pendingThemes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-warning/10 to-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-lightbulb text-warning text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucun thème en attente</p>
                  <p className="text-gray-400 text-xs">Tous les thèmes ont été traités</p>
                </div>
              ) : (
                pendingThemes.map((theme) => (
                  <div key={theme.id} className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-warning/20 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{theme.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Proposé par {theme.proposedBy.name}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {theme.daysAgo !== undefined 
                            ? (theme.daysAgo === 0 ? "Aujourd'hui" : theme.daysAgo === 1 ? 'Hier' : `Il y a ${theme.daysAgo} jours`)
                            : formatTimeAgo(theme.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApproveTheme(theme.id)}
                          disabled={updateTheme.isPending}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-r from-success to-emerald-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateTheme.isPending ? (
                            <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                          ) : (
                            <i className="fa-solid fa-check mr-1"></i>
                          )}
                          Valider
                        </button>
                        <button
                          onClick={() => handleRejectTheme(theme.id)}
                          disabled={updateTheme.isPending}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateTheme.isPending ? (
                            <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                          ) : (
                            <i className="fa-solid fa-times mr-1"></i>
                          )}
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sondages en cours */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fa-solid fa-poll text-accent mr-2"></i>
                Sondages en cours
              </h3>
              <Link
                to="/admin/sondages/create"
                className="w-full sm:w-auto bg-gradient-to-r from-accent to-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Nouveau sondage
              </Link>
            </div>
            <div className="space-y-4">
              {activePolls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-square-poll-vertical text-accent text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucun sondage en cours</p>
                  <p className="text-gray-400 text-xs">Créez un nouveau sondage pour recueillir les avis</p>
                </div>
              ) : (
                activePolls.map((poll) => {
                  const roundedParticipation = Math.round(poll.participation || 0)
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
                  <div key={poll.id} className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{poll.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 sm:space-x-4 text-xs sm:text-sm text-gray-600 mt-2">
                          <span className="flex items-center">
                            <i className="fa-solid fa-users mr-1 text-accent"></i>
                            {poll.totalResponses} réponses
                          </span>
                          {poll.daysLeft !== undefined && poll.daysLeft !== null && (
                            <span className="flex items-center">
                              <i className="fa-solid fa-clock mr-1 text-warning"></i>
                              {poll.daysLeft === 0 
                                ? 'Dernier jour pour voter'
                                : poll.daysLeft < 0
                                ? `Terminé le ${formatEndDate(poll.endDate)}`
                                : `Se termine dans ${poll.daysLeft} jour${poll.daysLeft > 1 ? 's' : ''}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Link
                          to={`/admin/sondages/${poll.id}`}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-r from-accent to-blue-600 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all text-center"
                        >
                          <i className="fa-solid fa-chart-bar mr-1"></i>
                          Résultats
                        </Link>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-accent to-blue-600 h-2 rounded-full"
                        style={{ width: `${roundedParticipation}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{roundedParticipation}% de participation</p>
                  </div>
                )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Ressources en attente */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fa-solid fa-file-circle-exclamation text-secondary mr-2"></i>
                Ressources en attente
              </h3>
              <span className="bg-gradient-to-r from-secondary to-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">{stats.pendingResources}</span>
            </div>
            <div className="space-y-3">
              {pendingResources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary/10 to-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-file-circle-check text-secondary text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucune ressource en attente</p>
                  <p className="text-gray-400 text-xs">Toutes les ressources ont été traitées</p>
                </div>
              ) : (
                pendingResources.map((resource) => (
                  <div key={resource.id} className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-secondary/20 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">{resource.title}</h5>
                        <p className="text-xs text-gray-500">
                          {translateResourceType(resource.type)} • Soumis par {resource.submittedBy.name}
                        </p>
                                {resource.daysAgo !== undefined && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {resource.daysAgo === 0 ? "Aujourd'hui" : resource.daysAgo === 1 ? 'Hier' : resource.daysAgo > 0 ? `Il y a ${resource.daysAgo} jour${resource.daysAgo > 1 ? 's' : ''}` : formatTimeAgo(resource.createdAt)}
                                  </p>
                                )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveResource(resource.id)}
                        disabled={updateResourceStatus.isPending}
                        className="px-2 py-1 bg-gradient-to-r from-success to-emerald-500 text-white text-xs rounded hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateResourceStatus.isPending ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-check"></i>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectResource(resource.id)}
                        disabled={updateResourceStatus.isPending}
                        className="px-2 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateResourceStatus.isPending ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-times"></i>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedbacks récents */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fa-solid fa-message text-accent mr-2"></i>
                Feedbacks récents
              </h3>
              <Link to="/admin/feedbacks" className="text-accent hover:text-accent/80 text-sm font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {recentFeedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-comments text-accent text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Aucun feedback récent</p>
                  <p className="text-gray-400 text-xs">Aucun nouveau feedback n'a été reçu</p>
                </div>
              ) : (
                recentFeedbacks.map((feedback) => {
                  const authorName = feedback.anonymous
                    ? 'Anonyme'
                    : feedback.submittedBy
                    ? 'Utilisateur'
                    : 'Utilisateur'
                  
                  const authorAvatar = feedback.anonymous ? null : null

                  return (
                    <Link
                      key={feedback.id}
                      to={`/admin/feedbacks`}
                      className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-accent/20 hover:shadow-md transition-all block"
                    >
                      <div className="flex items-start">
                        {authorAvatar ? (
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                            <i className="fa-solid fa-user text-gray-400 text-xs"></i>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 text-sm truncate">{authorName}</h5>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{feedback.message || feedback.subject}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(feedback.submittedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

