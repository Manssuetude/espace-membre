import { useState, useMemo } from 'react'
import { useFeedbacks, useUpdateFeedback, useDeleteFeedback } from '../../services/hooks/useFeedback'
import { useMembers } from '../../services/hooks/useMembers'
import Dropdown from '../../components/Dropdown'

const Feedbacks = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch feedbacks
  const { data: feedbacksData, isLoading: isLoadingFeedbacks } = useFeedbacks({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    limit: 100,
  })

  // Fetch members to get user names
  const { data: membersData } = useMembers({ limit: 100 })
  const members = membersData?.data || []

  // Create a map of user IDs to member names
  const memberMap = useMemo(() => {
    const map: Record<string, { name: string; avatar: string | null }> = {}
    members.forEach((member) => {
      if (member.id) {
        map[member.id] = {
          name: member.name || `${member.firstName} ${member.lastName}`,
          avatar: member.avatar || null,
        }
      }
    })
    return map
  }, [members])

  const feedbacks = feedbacksData?.data || []

  // Filter feedbacks by search term
  const filteredFeedbacks = useMemo(() => {
    if (!searchTerm) return feedbacks

    const search = searchTerm.toLowerCase()
    return feedbacks.filter(
      (feedback) =>
        feedback.subject.toLowerCase().includes(search) ||
        feedback.message.toLowerCase().includes(search) ||
        (feedback.submittedBy && memberMap[feedback.submittedBy]?.name.toLowerCase().includes(search))
    )
  }, [feedbacks, searchTerm, memberMap])

  // Calculate stats
  const stats = useMemo(() => {
    const total = feedbacks.length
    const newCount = feedbacks.filter((f) => f.status === 'new').length
    return { total, newCount }
  }, [feedbacks])

  const updateFeedbackMutation = useUpdateFeedback()
  const deleteFeedbackMutation = useDeleteFeedback()

  const handleStatusChange = (feedbackId: string, newStatus: 'new' | 'read' | 'resolved') => {
    updateFeedbackMutation.mutate({
      id: feedbackId,
      data: { status: newStatus },
    })
  }

  const handleDelete = (feedbackId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce feedback ?')) {
      deleteFeedbackMutation.mutate(feedbackId)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Date inconnue'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays === 1) {
      return 'Il y a 1j'
    } else {
      return `Il y a ${diffDays}j`
    }
  }

  if (isLoadingFeedbacks) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-accent/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Feedbacks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-comments text-accent text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">En Attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.newCount}</p>
              <p className="text-sm text-warning mt-1">À traiter</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-clock text-primary text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher dans les feedbacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>
            <Dropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'new', label: 'Nouveau' },
                { value: 'read', label: 'Lu' },
                { value: 'resolved', label: 'Résolu' },
              ]}
              className="min-w-[150px]"
            />
            <Dropdown
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Toutes les catégories' },
                { value: 'Session', label: 'Session' },
                { value: 'Général', label: 'Général' },
              ]}
              className="min-w-[150px]"
            />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
              <i className="fa-solid fa-download mr-2"></i>
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50">
          <i className="fa-solid fa-comments text-gray-300 text-4xl mb-4"></i>
          <p className="text-gray-500 text-sm">Aucun feedback trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => {
            const authorInfo = feedback.submittedBy && !feedback.anonymous ? memberMap[feedback.submittedBy] : null
            const authorName = feedback.anonymous ? 'Anonyme' : authorInfo?.name || 'Utilisateur inconnu'
            const authorAvatar = authorInfo?.avatar

            return (
              <div key={feedback.id} className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 p-4 sm:p-6 hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {authorAvatar && !feedback.anonymous ? (
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-user text-gray-400 text-sm sm:text-base"></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{authorName}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{feedback.category}</span>
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">{feedback.type}</span>
                        {feedback.anonymous && (
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">Anonyme</span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            feedback.status === 'new'
                              ? 'bg-primary/10 text-primary'
                              : feedback.status === 'read'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-success/10 text-success'
                          }`}
                        >
                          {feedback.status === 'new' ? 'Nouveau' : feedback.status === 'read' ? 'Lu' : 'Résolu'}
                        </span>
                      </div>
                      <h5 className="font-medium text-gray-900 text-sm sm:text-base mb-1">{feedback.subject}</h5>
                      <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">{feedback.message}</p>
                      {feedback.rating && (
                        <div className="flex items-center space-x-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fa-solid fa-star text-sm ${
                                star <= feedback.rating! ? 'text-warning' : 'text-gray-300'
                              }`}
                            ></i>
                          ))}
                        </div>
                      )}
                      <div className="hidden sm:flex items-center space-x-4 text-xs sm:text-sm text-gray-500">
                        <span>{formatTimeAgo(feedback.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 sm:hidden">{formatTimeAgo(feedback.submittedAt)}</span>
                    <div className="flex items-center space-x-2">
                      {feedback.status === 'new' && (
                        <button
                          onClick={() => handleStatusChange(feedback.id, 'read')}
                          className="px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all text-xs sm:text-sm"
                          title="Marquer comme lu"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                      {feedback.status === 'read' && (
                        <button
                          onClick={() => handleStatusChange(feedback.id, 'resolved')}
                          className="px-3 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-all text-xs sm:text-sm"
                          title="Marquer comme résolu"
                        >
                          <i className="fa-solid fa-check-double"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(feedback.id)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Feedbacks

